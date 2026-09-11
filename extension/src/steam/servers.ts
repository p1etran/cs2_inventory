/**
 * Choosing a Steam connection manager to talk to.
 *
 * The directory mixes transports, so filtering is not optional: the first
 * version of the feasibility spike tried TCP endpoints as WebSocket URLs and
 * concluded, wrongly, that Steam was refusing us. A browser needs
 * `type: "websockets"`, `realm: "steamglobal"`, and port 443 -- the same
 * narrowing steam-user applies under its `webCompatibilityMode`, documented
 * for use "through a firewall or a proxy".
 */

const DIRECTORY_URL =
  'https://api.steampowered.com/ISteamDirectory/GetCMListForConnect/v1/?cellid=0&cmtype=websockets';

export interface CmServer {
  endpoint: string;
  /** Steam's own load figure; lower is a better bet. */
  load: number;
}

interface DirectoryEntry {
  endpoint?: string;
  type?: string;
  realm?: string;
  load?: number;
  wtd_load?: number;
}

/** Filters and orders the directory's reply. Pure, so it can be tested. */
export function selectServers(entries: unknown): CmServer[] {
  const list: DirectoryEntry[] = Array.isArray(entries)
    ? entries
    : Object.values((entries ?? {}) as Record<string, DirectoryEntry>);

  return list
    .filter(
      (entry): entry is DirectoryEntry & { endpoint: string } =>
        typeof entry?.endpoint === 'string' &&
        entry.type === 'websockets' &&
        entry.realm === 'steamglobal' &&
        // A browser can only speak WebSocket over the standard HTTPS port.
        entry.endpoint.endsWith(':443'),
    )
    .map((entry) => ({ endpoint: entry.endpoint, load: entry.load ?? 999 }))
    .sort((a, b) => a.load - b.load);
}

export type DirectoryFetcher = (url: string) => Promise<unknown>;

const defaultFetcher: DirectoryFetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Steam server directory returned HTTP ${response.status}`);
  }
  return response.json();
};

export async function fetchCmServers(fetcher: DirectoryFetcher = defaultFetcher): Promise<CmServer[]> {
  const body = (await fetcher(DIRECTORY_URL)) as { response?: { serverlist?: unknown } };
  const servers = selectServers(body?.response?.serverlist);

  if (servers.length === 0) {
    throw new Error(
      'Steam listed no WebSocket servers on port 443. The directory response may have changed shape.',
    );
  }
  return servers;
}

export function cmSocketUrl(endpoint: string): string {
  return `wss://${endpoint}/cmsocket/`;
}
