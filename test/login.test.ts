import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { EAuthSessionGuardType } from 'steam-session';
import { loginWithPassword, LoginError, type AuthSession, type LoginIo } from '../src/steam/login.js';

interface FakeOptions {
  actionRequired: boolean;
  validActions?: { type: number; detail?: string }[];
  /** Rejects the first N codes, then accepts. */
  rejectCodes?: number;
  startError?: Error;
}

class FakeSession extends EventEmitter {
  submitted: string[] = [];
  cancelled = false;
  refreshToken = 'refresh-token-abc';
  steamID = { getSteamID64: () => '76561198061412334' };
  private remaining: number;

  constructor(private readonly options: FakeOptions) {
    super();
    this.remaining = options.rejectCodes ?? 0;
  }

  async startWithCredentials(): Promise<{
    actionRequired: boolean;
    validActions?: { type: number; detail?: string }[];
  }> {
    if (this.options.startError) throw this.options.startError;
    return { actionRequired: this.options.actionRequired, validActions: this.options.validActions };
  }

  async submitSteamGuardCode(code: string): Promise<void> {
    this.submitted.push(code);
    if (this.remaining > 0) {
      this.remaining -= 1;
      throw new Error('Incorrect code');
    }
    // Steam confirms by polling, which lands as an event shortly after.
    setImmediate(() => this.emit('authenticated'));
  }

  cancelLoginAttempt(): boolean {
    this.cancelled = true;
    return true;
  }

  /** Stands in for the user tapping approve in the Steam mobile app. */
  approveOnPhone(): void {
    this.emit('remoteInteraction');
    setImmediate(() => this.emit('authenticated'));
  }
}

function io(codes: string[] = []): LoginIo & { messages: string[]; labels: string[] } {
  const messages: string[] = [];
  const labels: string[] = [];
  const queue = [...codes];

  return {
    messages,
    labels,
    report: (message) => messages.push(message),
    requestCode: (label, signal) => {
      labels.push(label);
      const next = queue.shift();
      if (next !== undefined) return Promise.resolve(next);
      // Nothing more to type: wait for the signal, like a real open prompt.
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
      });
    },
  };
}

const BOTH = [
  { type: EAuthSessionGuardType.DeviceCode },
  { type: EAuthSessionGuardType.DeviceConfirmation },
];

const login = (session: FakeSession, prompts: ReturnType<typeof io>, sharedSecret?: string) =>
  loginWithPassword({
    accountName: 'petro',
    password: 'hunter2',
    sharedSecret,
    io: prompts,
    createSession: () => session as unknown as AuthSession,
  });

describe('loginWithPassword', () => {
  it('returns the refresh token when no second factor is needed', async () => {
    const session = new FakeSession({ actionRequired: false });
    setImmediate(() => session.emit('authenticated'));

    const result = await login(session, io());
    expect(result).toEqual({
      steamId: '76561198061412334',
      refreshToken: 'refresh-token-abc',
    });
  });

  it('completes when the sign-in is approved on a phone', async () => {
    const session = new FakeSession({ actionRequired: true, validActions: BOTH });
    const prompts = io(); // The user types nothing and approves instead.

    const pending = login(session, prompts);
    setImmediate(() => session.approveOnPhone());

    await expect(pending).resolves.toMatchObject({ refreshToken: 'refresh-token-abc' });
    // The session must survive: cancelling it is what made approval impossible.
    expect(session.cancelled).toBe(false);
    expect(session.submitted).toEqual([]);
  });

  it('completes when a code is typed instead', async () => {
    const session = new FakeSession({ actionRequired: true, validActions: BOTH });
    const prompts = io(['12345']);

    await expect(login(session, prompts)).resolves.toMatchObject({
      refreshToken: 'refresh-token-abc',
    });
    expect(session.submitted).toEqual(['12345']);
  });

  it('offers both routes in the message and the prompt label', async () => {
    const session = new FakeSession({ actionRequired: true, validActions: BOTH });
    const prompts = io(['12345']);
    await login(session, prompts);

    expect(prompts.messages[0]).toMatch(/phone.*or type a code/i);
    expect(prompts.labels[0]).toMatch(/approve on your phone/i);
  });

  it('retries a rejected code on the same session rather than starting over', async () => {
    const session = new FakeSession({ actionRequired: true, validActions: BOTH, rejectCodes: 1 });
    const start = vi.spyOn(session, 'startWithCredentials');
    const prompts = io(['11111', '22222']);

    await expect(login(session, prompts)).resolves.toMatchObject({
      refreshToken: 'refresh-token-abc',
    });
    expect(session.submitted).toEqual(['11111', '22222']);
    // A second startWithCredentials would send another push to the phone.
    expect(start).toHaveBeenCalledTimes(1);
    expect(prompts.messages.some((m) => /did not accept that code/i.test(m))).toBe(true);
  });

  it('labels an email code with the address it went to', async () => {
    const session = new FakeSession({
      actionRequired: true,
      validActions: [{ type: EAuthSessionGuardType.EmailCode, detail: 'y****.com' }],
    });
    const prompts = io(['ABCDE']);
    await login(session, prompts);

    expect(prompts.labels[0]).toContain('y****.com');
    // No phone route here, so the label must not promise one.
    expect(prompts.labels[0]).not.toMatch(/phone/i);
  });

  it('waits without prompting when only phone approval is offered', async () => {
    const session = new FakeSession({
      actionRequired: true,
      validActions: [{ type: EAuthSessionGuardType.DeviceConfirmation }],
    });
    const prompts = io();

    const pending = login(session, prompts);
    setImmediate(() => session.approveOnPhone());

    await expect(pending).resolves.toMatchObject({ refreshToken: 'refresh-token-abc' });
    expect(prompts.labels).toEqual([]);
    expect(prompts.messages[0]).toMatch(/Approve it there to continue/i);
  });

  it('generates the code locally when a shared secret is configured', async () => {
    const session = new FakeSession({ actionRequired: false });
    const start = vi.spyOn(session, 'startWithCredentials');
    setImmediate(() => session.emit('authenticated'));

    // A valid base64 shared secret; the generated code is time-based.
    await login(session, io(), 'cnOgv/KdpLoP6Nbh0GMkXkPXALQ=');
    const details = start.mock.calls[0]?.[0] as { steamGuardCode?: string } | undefined;
    expect(details?.steamGuardCode).toMatch(/^[0-9A-Z]{5}$/);
  });

  it('surfaces a rejected sign-in rather than hanging', async () => {
    const session = new FakeSession({
      actionRequired: false,
      startError: new Error('InvalidPassword'),
    });
    await expect(login(session, io())).rejects.toBeInstanceOf(LoginError);
    await expect(login(session, io())).rejects.toThrow(/InvalidPassword/);
  });

  it('reports a timeout and cancels the attempt', async () => {
    const session = new FakeSession({ actionRequired: true, validActions: BOTH });
    const pending = login(session, io());
    setImmediate(() => session.emit('timeout'));

    await expect(pending).rejects.toThrow(/gave up waiting/i);
    expect(session.cancelled).toBe(true);
  });

  it('reports an error raised while polling', async () => {
    const session = new FakeSession({ actionRequired: true, validActions: BOTH });
    const pending = login(session, io());
    setImmediate(() => session.emit('error', new Error('Steam is down')));

    await expect(pending).rejects.toThrow(/Steam is down/);
    expect(session.cancelled).toBe(true);
  });

  it('refuses a guard type it cannot satisfy instead of waiting forever', async () => {
    const session = new FakeSession({
      actionRequired: true,
      validActions: [{ type: EAuthSessionGuardType.MachineToken }],
    });
    await expect(login(session, io())).rejects.toThrow(/cannot provide/i);
    expect(session.cancelled).toBe(true);
  });
});
