import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearSession,
  isSessionEncrypted,
  loadSession,
  saveSession,
  SessionLockedError,
  type StoredSession,
} from '../src/steam/credentials.js';

const session: StoredSession = {
  steamId: '76561198000000000',
  accountName: 'someone',
  refreshToken: 'eyJhbGciOi.refresh.token',
  savedAt: '2026-01-01T00:00:00.000Z',
};

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cs2inv-'));
  file = path.join(dir, 'steam-session.json');
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('session storage', () => {
  it('round-trips an encrypted session', async () => {
    await saveSession(file, session, 'correct horse');
    expect(await isSessionEncrypted(file)).toBe(true);
    expect(await loadSession(file, 'correct horse')).toEqual(session);
  });

  it('never writes the token in the clear when a passphrase is given', async () => {
    await saveSession(file, session, 'correct horse');
    const raw = await fs.readFile(file, 'utf8');
    expect(raw).not.toContain(session.refreshToken);
  });

  it('rejects the wrong passphrase instead of returning junk', async () => {
    await saveSession(file, session, 'correct horse');
    await expect(loadSession(file, 'wrong horse')).rejects.toBeInstanceOf(SessionLockedError);
  });

  it('explains itself when a passphrase is needed but missing', async () => {
    await saveSession(file, session, 'correct horse');
    await expect(loadSession(file, null)).rejects.toThrow(/encrypted/i);
  });

  it('stores unencrypted only when asked, and owner-readable only', async () => {
    await saveSession(file, session, null);
    expect(await isSessionEncrypted(file)).toBe(false);
    expect(await loadSession(file, null)).toEqual(session);

    const stat = await fs.stat(file);
    expect(stat.mode & 0o077).toBe(0);
  });

  it('returns null when there is no saved session', async () => {
    expect(await loadSession(file, null)).toBeNull();
    expect(await isSessionEncrypted(file)).toBeNull();
  });

  it('clears the session file', async () => {
    await saveSession(file, session, null);
    await clearSession(file);
    expect(await loadSession(file, null)).toBeNull();
  });
});
