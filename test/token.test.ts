import { describe, expect, it } from 'vitest';
import { inspectRefreshToken } from '../src/steam/token.js';

/** Builds a JWT-shaped token; only the payload segment is ever read. */
function token(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.signature`;
}

const NOW = new Date('2026-06-01T00:00:00.000Z');
const inSeconds = (date: string) => Math.floor(new Date(date).getTime() / 1000);

describe('inspectRefreshToken', () => {
  it('accepts a live Steam refresh token', () => {
    const info = inspectRefreshToken(
      token({ iss: 'steam', sub: '76561198061412334', exp: inSeconds('2026-12-01T00:00:00Z') }),
      NOW,
    );
    expect(info.valid).toBe(true);
    expect(info.expired).toBe(false);
    expect(info.steamId).toBe('76561198061412334');
    expect(info.problem).toBeNull();
  });

  it('flags an expired token with the date it lapsed', () => {
    const info = inspectRefreshToken(
      token({ iss: 'steam', sub: '765', exp: inSeconds('2026-01-15T00:00:00Z') }),
      NOW,
    );
    expect(info.valid).toBe(false);
    expect(info.expired).toBe(true);
    expect(info.problem).toContain('2026-01-15');
  });

  it('rejects an access token, which the login server will not take', () => {
    const info = inspectRefreshToken(token({ iss: 'r:ABCD_1234', sub: '765' }), NOW);
    expect(info.valid).toBe(false);
    expect(info.problem).toMatch(/not a Steam refresh token/);
  });

  it('rejects a token that is not a JWT at all', () => {
    // This is what previously crashed the process with a raw "Invalid JWT".
    expect(inspectRefreshToken('fake-token', NOW).problem).toMatch(/not readable/);
    expect(inspectRefreshToken('a.b', NOW).problem).toMatch(/not readable/);
    expect(inspectRefreshToken('a.!!!notbase64!!!.c', NOW).problem).toMatch(/not readable/);
  });

  it('rejects an empty token', () => {
    expect(inspectRefreshToken('', NOW).problem).toMatch(/no token/);
  });

  it('treats a token with no expiry as usable', () => {
    const info = inspectRefreshToken(token({ iss: 'steam', sub: '765' }), NOW);
    expect(info.valid).toBe(true);
    expect(info.expiresAt).toBeNull();
  });
});
