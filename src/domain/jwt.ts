/**
 * Reading a Steam token's own claims, without a library and without Node.
 *
 * A Steam refresh token is a JWT, and the claims say who it belongs to, when
 * it expires, and -- the one that decides what this whole extension can do --
 * which audiences it is valid for. A browser session's token is `['web']`
 * only; logging on as a game client needs `['web', 'client']`, and there is no
 * way to widen one, so checking before trying turns an opaque Steam refusal
 * into something a person can act on.
 *
 * `atob` rather than `Buffer`, so this works in a browser as well as in Node.
 * `src/core.ts` re-exports it and `test/portability.test.ts` keeps it honest.
 */

export interface JwtClaims {
  iss?: string;
  sub?: string;
  exp?: number;
  aud?: string[];
}

/** Decodes base64url, which differs from base64 in two characters and padding. */
function decodeBase64Url(value: string): string | null {
  const standard = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard.padEnd(standard.length + ((4 - (standard.length % 4)) % 4), '=');
  try {
    // atob gives one byte per character, so decode UTF-8 by hand rather than
    // mangling any non-ASCII claim.
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** The claims in a JWT, or null if it is not one. No signature check: we are not verifying it. */
export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;

  const json = decodeBase64Url(parts[1]);
  if (json === null) return null;

  try {
    const claims = JSON.parse(json) as Record<string, unknown>;
    // `aud` is a string or an array of them, per the JWT spec.
    const audience = claims.aud;
    return {
      ...(claims as JwtClaims),
      aud:
        typeof audience === 'string'
          ? [audience]
          : Array.isArray(audience)
            ? audience.filter((entry): entry is string => typeof entry === 'string')
            : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Whether a token may be used to log on as a game client.
 *
 * This is the check that explains the extension's shape: a token taken from
 * the browser's Steam session fails it, and the CS2 game coordinator will not
 * grant a session without one that passes.
 */
export function isClientToken(token: string): boolean {
  return decodeJwtClaims(token)?.aud?.includes('client') ?? false;
}
