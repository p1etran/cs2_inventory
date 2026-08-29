/**
 * Minimal ambient declarations for the two Steam libraries, which ship no
 * types of their own. Only the surface this app uses is described.
 */
declare module 'steam-user' {
  import { EventEmitter } from 'node:events';

  interface LogOnDetails {
    accountName?: string;
    password?: string;
    refreshToken?: string;
    twoFactorCode?: string;
    authCode?: string;
    machineAuthToken?: string;
    logonID?: number;
  }

  class SteamID {
    getSteamID64(): string;
  }

  class SteamUser extends EventEmitter {
    steamID: SteamID | null;
    setOption(name: string, value: unknown): void;
    logOn(details: LogOnDetails): void;
    logOff(): void;
    setPersona(state: number): void;
    gamesPlayed(apps: number[] | number, force?: boolean): void;
    static EPersonaState: { Offline: number; Online: number; Invisible: number };
  }

  export = SteamUser;
}

declare module 'globaloffensive' {
  import { EventEmitter } from 'node:events';
  import type SteamUser from 'steam-user';

  interface EconItem {
    id?: unknown;
    def_index?: number;
    quality?: number;
    rarity?: number;
    origin?: number;
    inventory?: number;
    position?: number;
    attribute?: { def_index?: number; value_bytes?: Buffer }[];
    paint_index?: number;
    paint_seed?: number;
    paint_wear?: number;
    custom_name?: string;
    casket_id?: string;
    casket_contained_item_count?: number;
    tradable_after?: Date;
  }

  class GlobalOffensive extends EventEmitter {
    constructor(steamUser: SteamUser);
    haveGCSession: boolean;
    inventory: EconItem[] | undefined;
    getCasketContents(casketId: string, callback: (err: Error | null, items?: EconItem[]) => void): void;
  }

  export = GlobalOffensive;
}

declare module 'steam-totp' {
  export function generateAuthCode(sharedSecret: string, timeOffset?: number): string;
}
