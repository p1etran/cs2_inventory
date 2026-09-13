import type { Config } from '../config.js';
import { loadCatalog } from '../catalog/store.js';
import type { Db } from '../db/database.js';
import { GcClient } from '../steam/gc.js';
import { loadSession } from '../steam/credentials.js';
import { runSync, type SyncSummary } from '../sync/sync.js';

export type SyncState = 'idle' | 'running' | 'done' | 'failed';

export interface SyncStatus {
  state: SyncState;
  startedAt: string | null;
  finishedAt: string | null;
  messages: string[];
  summary: SyncSummary | null;
  error: string | null;
}

const MAX_MESSAGES = 200;

/**
 * Serializes sync requests from the web UI. Only one can run at a time
 * because a second CS2 game-coordinator session would evict the first.
 */
export class SyncRunner {
  private status: SyncStatus = {
    state: 'idle',
    startedAt: null,
    finishedAt: null,
    messages: [],
    summary: null,
    error: null,
  };

  constructor(
    private readonly db: Db,
    private readonly config: Config,
  ) {}

  getStatus(): SyncStatus {
    return this.status;
  }

  get isRunning(): boolean {
    return this.status.state === 'running';
  }

  private push(message: string): void {
    this.status.messages.push(`${new Date().toISOString()} ${message}`);
    if (this.status.messages.length > MAX_MESSAGES) {
      this.status.messages.splice(0, this.status.messages.length - MAX_MESSAGES);
    }
  }

  start(): SyncStatus {
    if (this.isRunning) return this.status;

    this.status = {
      state: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      messages: [],
      summary: null,
      error: null,
    };

    void this.execute().then(
      (summary) => {
        this.status.state = 'done';
        this.status.summary = summary;
        this.status.finishedAt = new Date().toISOString();
      },
      (error: unknown) => {
        this.status.state = 'failed';
        this.status.error = error instanceof Error ? error.message : String(error);
        this.status.finishedAt = new Date().toISOString();
      },
    );

    return this.status;
  }

  private async execute(): Promise<SyncSummary> {
    const session = await loadSession(this.config.credentialsPath, this.config.passphrase);
    if (!session) {
      throw new Error('No saved Steam session. Run the login command first.');
    }

    const onProgress = (message: string) => this.push(message);
    const catalog = await loadCatalog({ filePath: this.config.catalogPath, onProgress });

    const gc = new GcClient({
      dataDirectory: this.config.dataDir,
      casketDelayMs: this.config.casketDelayMs,
      onProgress,
    });

    try {
      onProgress('logging in to Steam');
      const { steamId } = await gc.loginWithRefreshToken(session.refreshToken);
      return await runSync({ db: this.db, gc, catalog, steamId, onProgress });
    } finally {
      gc.disconnect();
    }
  }
}
