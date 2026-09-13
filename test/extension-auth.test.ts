import { describe, expect, it, vi } from 'vitest';
import { AuthError, beginQrSession, signInWithQr } from '../extension/src/steam/auth.js';
import type { CmClient } from '../extension/src/steam/cm.js';
import {
  CAuthentication_BeginAuthSessionViaQR_Request,
  CAuthentication_BeginAuthSessionViaQR_Response,
  CAuthentication_PollAuthSessionStatus_Response,
  decode,
  encode,
} from '../extension/src/steam/protos.js';
import { inspectToken } from '../extension/src/steam/tokens.js';

/**
 * The QR sign-in, driven against a stand-in for the connection.
 *
 * The flow has more states than it looks: Steam rotates the challenge while
 * someone reaches for their phone, reports a scan before an approval, and only
 * then returns a token. Getting the rotation wrong leaves a dead code on
 * screen with no error anywhere, which is the kind of thing only a test
 * catches.
 */

interface Call {
  target: string;
  body: Uint8Array;
}

/** A connection whose service replies are scripted. */
function fakeCm(replies: (call: Call, index: number) => Uint8Array) {
  const calls: Call[] = [];
  let index = 0;
  const cm = {
    sayHello: () => {},
    callService: (target: string, body: Uint8Array) => {
      const call = { target, body };
      calls.push(call);
      return Promise.resolve(replies(call, index++));
    },
  };
  return { cm: cm as unknown as CmClient, calls };
}

const challengeReply = (clientId: string, url: string, interval = 5) =>
  encode(CAuthentication_BeginAuthSessionViaQR_Response, {
    client_id: clientId,
    request_id: new Uint8Array([9, 9, 9]),
    challenge_url: url,
    interval,
  });

const pollReply = (fields: Record<string, unknown>) =>
  encode(CAuthentication_PollAuthSessionStatus_Response, fields);

describe('starting a QR sign-in', () => {
  it('asks for a client-audience session, which is the whole point', async () => {
    const { cm, calls } = fakeCm(() => challengeReply('1', 'https://s.team/q/1/1'));
    await beginQrSession(cm);

    expect(calls[0]?.target).toBe('Authentication.BeginAuthSessionViaQR#1');
    const request = decode<{
      platform_type?: number;
      device_details?: { platform_type?: number; device_friendly_name?: string };
    }>(CAuthentication_BeginAuthSessionViaQR_Request, calls[0]?.body ?? new Uint8Array());

    // 1 is EAuthTokenPlatformType.SteamClient. A web or mobile platform type
    // yields a token the CS2 coordinator refuses, so this literal matters more
    // than it looks.
    expect(request.platform_type).toBe(1);
    expect(request.device_details?.platform_type).toBe(1);
    // Self-identifying, so it can be recognised and revoked in Steam's
    // device list rather than masquerading as a PC.
    expect(request.device_details?.device_friendly_name).toMatch(/CS2 Inventory/);
  });

  it('refuses a reply with no challenge rather than showing a blank code', async () => {
    const { cm } = fakeCm(() => encode(CAuthentication_BeginAuthSessionViaQR_Response, {}));
    await expect(beginQrSession(cm)).rejects.toThrow(AuthError);
  });
});

describe('waiting for the scan', () => {
  it('returns the token once it is approved', async () => {
    const { cm } = fakeCm((call) =>
      call.target.includes('BeginAuth')
        ? challengeReply('1', 'https://s.team/q/1/1')
        : pollReply({ refresh_token: 'the-token', account_name: 'someone' }),
    );

    vi.useFakeTimers();
    try {
      const shown: string[] = [];
      const signedIn = signInWithQr(cm, { onChallenge: (url) => shown.push(url) });
      await vi.advanceTimersByTimeAsync(6_000);

      await expect(signedIn).resolves.toEqual({
        refreshToken: 'the-token',
        accountName: 'someone',
      });
      expect(shown).toEqual(['https://s.team/q/1/1']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('redraws when Steam rotates the challenge', async () => {
    const { cm } = fakeCm((call, index) => {
      if (call.target.includes('BeginAuth')) return challengeReply('1', 'https://s.team/q/1/1');
      // First poll rotates the code; the second approves.
      return index === 1
        ? pollReply({ new_client_id: '2', new_challenge_url: 'https://s.team/q/1/2' })
        : pollReply({ refresh_token: 'the-token', account_name: 'someone' });
    });

    vi.useFakeTimers();
    try {
      const shown: string[] = [];
      const signedIn = signInWithQr(cm, { onChallenge: (url) => shown.push(url) });
      await vi.advanceTimersByTimeAsync(30_000);
      await signedIn;

      // A stale code on screen fails silently: the phone simply does nothing.
      expect(shown).toEqual(['https://s.team/q/1/1', 'https://s.team/q/1/2']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('says when the code has been scanned but not yet approved', async () => {
    const { cm } = fakeCm((call, index) => {
      if (call.target.includes('BeginAuth')) return challengeReply('1', 'https://s.team/q/1/1');
      // Steam keeps reporting the scan on every poll until it is approved, so
      // several polls see it before the token arrives.
      return index < 4
        ? pollReply({ had_remote_interaction: true })
        : pollReply({ refresh_token: 'the-token' });
    });

    vi.useFakeTimers();
    try {
      let scans = 0;
      const signedIn = signInWithQr(cm, { onChallenge: () => {}, onScanned: () => (scans += 1) });
      await vi.advanceTimersByTimeAsync(60_000);
      await signedIn;

      // Reported once, not on every poll after the scan.
      expect(scans).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives up rather than polling forever', async () => {
    const { cm, calls } = fakeCm((call) =>
      call.target.includes('BeginAuth')
        ? challengeReply('1', 'https://s.team/q/1/1')
        : pollReply({}),
    );

    vi.useFakeTimers();
    try {
      const signedIn = signInWithQr(cm, { onChallenge: () => {} });
      const settled = signedIn.catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(6 * 60_000);

      expect(await settled).toBeInstanceOf(AuthError);
      const polls = calls.length;
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls.length).toBe(polls);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops when cancelled', async () => {
    const { cm } = fakeCm((call) =>
      call.target.includes('BeginAuth')
        ? challengeReply('1', 'https://s.team/q/1/1')
        : pollReply({}),
    );

    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const settled = signInWithQr(cm, {
        onChallenge: () => {},
        signal: controller.signal,
      }).catch((error: unknown) => error);

      controller.abort();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await settled).toBeInstanceOf(AuthError);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('judging a saved sign-in', () => {
  const jwt = (claims: Record<string, unknown>) => {
    const part = (value: unknown) =>
      Buffer.from(JSON.stringify(value))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `${part({ alg: 'EdDSA' })}.${part(claims)}.sig`;
  };
  const future = Math.floor(Date.now() / 1000) + 86_400;

  it('accepts a client token', () => {
    const status = inspectToken(jwt({ iss: 'steam', sub: '765', exp: future, aud: ['web', 'client'] }));
    expect(status).toMatchObject({ usable: true, steamId: '765', problem: null });
  });

  it('rejects the browser session, and says why in plain words', () => {
    const status = inspectToken(jwt({ iss: 'steam', sub: '765', exp: future, aud: ['web'] }));
    expect(status.usable).toBe(false);
    // This is the finding that shaped the product; the message should say it.
    expect(status.problem).toMatch(/browser session/);
  });

  it('rejects an expired sign-in with its date', () => {
    const status = inspectToken(
      jwt({ iss: 'steam', sub: '765', exp: Math.floor(Date.now() / 1000) - 10, aud: ['web', 'client'] }),
    );
    expect(status.usable).toBe(false);
    expect(status.problem).toMatch(/expired on \d{4}-\d{2}-\d{2}/);
  });

  it('rejects nonsense', () => {
    expect(inspectToken('').usable).toBe(false);
    expect(inspectToken('not-a-token').usable).toBe(false);
  });
});
