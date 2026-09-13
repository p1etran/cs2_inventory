import { describe, expect, it } from 'vitest';
import { EMsg, EResult, emsgName } from '../extension/src/steam/emsg.js';

/**
 * Cross-checks the hand-copied Steam message ids against steam-user's enums.
 *
 * These numbers were transcribed by hand and there is nothing in the protocol
 * to catch a wrong one: Steam ignores a message it does not recognise, so a
 * typo shows up as silence rather than an error. That is exactly how a
 * games-played sent as 742 came to leave the account not in-game, which the
 * CS2 coordinator answers by never replying at all.
 *
 * steam-user is a dependency of the local CLI, which works, so its enums are
 * a reference worth checking against rather than a second copy to maintain.
 */

import { createRequire } from 'node:module';

// Required rather than imported: these are CommonJS enum tables shipped
// without types, and a require keeps them out of the typed module graph.
const require = createRequire(import.meta.url);
const reference = require('steam-user/enums/EMsg.js') as Record<string, number>;
const eresults = require('steam-user/enums/EResult.js') as Record<string, number>;

describe('Steam message ids', () => {
  it.each(Object.entries(EMsg))('%s matches steam-user', (name, value) => {
    expect(reference[name]).toBe(value);
  });

  it('does not name a message Steam no longer acts on', () => {
    // Present in the enum, but sending it does nothing; the working path uses
    // ClientGamesPlayedWithDataBlob instead.
    expect(Object.values(EMsg)).not.toContain(reference.ClientGamesPlayed);
  });
});

describe('message names', () => {
  it('names a message we never handle', () => {
    // The point of shipping the whole table: an unexpected message is by
    // definition one that is not in the list we handle, and it is exactly
    // those that need to be legible in a log.
    const unhandled = reference.ClientPersonaState as number;
    expect(Object.values(EMsg)).not.toContain(unhandled);
    expect(emsgName(unhandled)).toBe(`ClientPersonaState (${unhandled})`);
  });

  it('still prints an id it has no name for', () => {
    expect(emsgName(999999)).toBe('EMsg 999999');
  });
});

describe('EResult codes', () => {
  it.each(Object.entries(EResult))('%s matches steam-user', (name, value) => {
    expect(eresults[name]).toBe(value);
  });
});
