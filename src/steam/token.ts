import { decodeJwtClaims } from '../domain/jwt.js';

/**
 * A Steam refresh token is a JWT. Reading it locally lets us say "sign in
 * again" in plain words instead of letting the Steam client throw a raw
 * "Invalid JWT" from deep inside a login attempt.
 */
export interface RefreshTokenInfo {
  /** Shaped like a Steam refresh token, so it is worth attempting a login. */
  valid: boolean;
  expired: boolean;
  expiresAt: Date | null;
  steamId: string | null;
  /** Why the token is unusable, when it is. */
  problem: string | null;
}


export function inspectRefreshToken(token: string, now = new Date()): RefreshTokenInfo {
  const unusable = (problem: string): RefreshTokenInfo => ({
    valid: false,
    expired: false,
    expiresAt: null,
    steamId: null,
    problem,
  });

  if (!token) return unusable('the saved session has no token');

  const claims = decodeJwtClaims(token);
  if (!claims) return unusable('the saved token is not readable');

  // Only refresh tokens carry iss=steam, and only those are accepted for login.
  if (claims.iss !== 'steam') return unusable('the saved token is not a Steam refresh token');
  if (!claims.sub) return unusable('the saved token names no account');

  const expiresAt = typeof claims.exp === 'number' ? new Date(claims.exp * 1000) : null;
  const expired = expiresAt !== null && expiresAt.getTime() <= now.getTime();

  return {
    valid: !expired,
    expired,
    expiresAt,
    steamId: claims.sub,
    problem: expired ? `the saved session expired on ${expiresAt?.toISOString().slice(0, 10)}` : null,
  };
}
