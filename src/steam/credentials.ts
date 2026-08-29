import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface StoredSession {
  steamId: string;
  accountName: string;
  refreshToken: string;
  savedAt: string;
}

interface EncryptedFile {
  version: 1;
  encrypted: true;
  salt: string;
  iv: string;
  tag: string;
  data: string;
}

interface PlainFile {
  version: 1;
  encrypted: false;
  payload: StoredSession;
}

type SessionFile = EncryptedFile | PlainFile;

const SCRYPT_KEYLEN = 32;
const OWNER_ONLY = 0o600;

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  // N=2^15 keeps an interactive unlock under a second while still being a
  // meaningful cost for anyone brute-forcing a stolen file.
  return crypto.scryptSync(passphrase, salt, SCRYPT_KEYLEN, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

export function encryptSession(session: StoredSession, passphrase: string): EncryptedFile {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  return {
    version: 1,
    encrypted: true,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
    data: data.toString('hex'),
  };
}

export function decryptSession(file: EncryptedFile, passphrase: string): StoredSession {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    deriveKey(passphrase, Buffer.from(file.salt, 'hex')),
    Buffer.from(file.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(file.tag, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(file.data, 'hex')),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8')) as StoredSession;
}

/**
 * Writes the session with owner-only permissions. A passphrase encrypts the
 * refresh token at rest; without one the file is still readable only by the
 * current user, which is the same protection the Steam client itself relies on.
 */
export async function saveSession(
  filePath: string,
  session: StoredSession,
  passphrase: string | null,
): Promise<void> {
  const file: SessionFile = passphrase
    ? encryptSession(session, passphrase)
    : { version: 1, encrypted: false, payload: session };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(file, null, 2), { encoding: 'utf8', mode: OWNER_ONLY });
  await fs.chmod(filePath, OWNER_ONLY);
}

export class SessionLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionLockedError';
  }
}

export async function loadSession(
  filePath: string,
  passphrase: string | null,
): Promise<StoredSession | null> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }

  const file = JSON.parse(raw) as SessionFile;
  if (!file.encrypted) return file.payload;

  if (!passphrase) {
    throw new SessionLockedError(
      'Saved Steam session is encrypted. Set CS2INV_PASSPHRASE or run with --passphrase.',
    );
  }
  try {
    return decryptSession(file, passphrase);
  } catch {
    throw new SessionLockedError('Could not decrypt the saved Steam session: wrong passphrase.');
  }
}

export async function isSessionEncrypted(filePath: string): Promise<boolean | null> {
  try {
    const file = JSON.parse(await fs.readFile(filePath, 'utf8')) as SessionFile;
    return file.encrypted;
  } catch {
    return null;
  }
}

export async function clearSession(filePath: string): Promise<void> {
  await fs.rm(filePath, { force: true });
}
