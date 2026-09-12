import { describe, expect, it } from 'vitest';
import { decodeJwtClaims, isClientToken } from '../src/domain/jwt.js';
import { inspectRefreshToken } from '../src/steam/token.js';

/** Builds an unsigned JWT with the given claims, base64url as Steam does. */
function jwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ typ: 'JWT', alg: 'EdDSA' })}.${encode(claims)}.signature`;
}

describe('reading a Steam token', () => {
  it('reads the claims that decide what a token can do', () => {
    const claims = decodeJwtClaims(
      jwt({ iss: 'steam', sub: '76561198061412334', exp: 1900000000, aud: ['web', 'client'] }),
    );
    expect(claims).toMatchObject({
      iss: 'steam',
      sub: '76561198061412334',
      exp: 1900000000,
      aud: ['web', 'client'],
    });
  });

  it('accepts a single-string audience, which the JWT spec allows', () => {
    expect(decodeJwtClaims(jwt({ aud: 'web' }))?.aud).toEqual(['web']);
  });

  it('survives a non-ASCII claim rather than mangling it', () => {
    // atob yields one byte per character, so UTF-8 has to be decoded after.
    expect(decodeJwtClaims(jwt({ sub: 'noże' }))?.sub).toBe('noże');
  });

  it('returns null for things that are not tokens', () => {
    for (const bad of ['', 'not.a.jwt', 'only.two', 'a.b.c.d']) {
      expect(decodeJwtClaims(bad)).toBeNull();
    }
  });

  it('tells a client token from a browser one', () => {
    // The whole reason the extension needs a QR sign-in: a token taken from
    // the browser's Steam session is web-only, and the CS2 coordinator will
    // not grant a session to it.
    expect(isClientToken(jwt({ aud: ['web', 'client'] }))).toBe(true);
    expect(isClientToken(jwt({ aud: ['web'] }))).toBe(false);
    expect(isClientToken(jwt({ aud: ['web', 'mobile'] }))).toBe(false);
    expect(isClientToken('garbage')).toBe(false);
  });
});

describe('the CLI token check, now sharing that decoder', () => {
  const future = Math.floor(Date.now() / 1000) + 86_400;
  const past = Math.floor(Date.now() / 1000) - 86_400;

  it('accepts a live Steam refresh token', () => {
    const info = inspectRefreshToken(jwt({ iss: 'steam', sub: '765', exp: future }));
    expect(info).toMatchObject({ valid: true, expired: false, steamId: '765' });
  });

  it('rejects an expired one, with the date', () => {
    const info = inspectRefreshToken(jwt({ iss: 'steam', sub: '765', exp: past }));
    expect(info.valid).toBe(false);
    expect(info.expired).toBe(true);
    expect(info.problem).toMatch(/expired on \d{4}-\d{2}-\d{2}/);
  });

  it('rejects a token minted by something other than Steam', () => {
    const info = inspectRefreshToken(jwt({ iss: 'elsewhere', sub: '765', exp: future }));
    expect(info).toMatchObject({ valid: false, problem: expect.stringContaining('not a Steam') });
  });
});
