import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import type { Config } from '../config.js';
import type { Db } from '../db/database.js';
import {
  getStats,
  listContainers,
  listFacets,
  listStacks,
  recentEvents,
  searchItems,
  type SearchOptions,
} from '../db/repo.js';
import { collectExport, exportCsv, exportFilename, exportJson } from '../export.js';
import { SyncRunner } from './syncRunner.js';

const WEB_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../web');

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function bool(value: unknown): boolean | undefined {
  return value === '1' || value === 'true' ? true : undefined;
}

function int(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function searchOptionsFrom(req: Request): SearchOptions {
  const location = str(req.query.location);
  const sort = str(req.query.sort);
  return {
    query: str(req.query.q),
    containerId: str(req.query.container) ?? null,
    location: location === 'loose' || location === 'stored' ? location : 'all',
    category: str(req.query.category),
    rarity: str(req.query.rarity),
    stattrak: bool(req.query.stattrak),
    souvenir: bool(req.query.souvenir),
    unresolvedOnly: bool(req.query.unresolved),
    sort: sort === 'float' || sort === 'recent' ? sort : 'name',
    limit: int(req.query.limit, 100),
    offset: int(req.query.offset, 0),
  };
}

export function createApp(db: Db, config: Config): express.Express {
  const app = express();
  const runner = new SyncRunner(db, config);

  app.use(express.json());

  app.get('/api/stats', (_req, res) => {
    res.json(getStats(db));
  });

  app.get('/api/facets', (_req, res) => {
    res.json({ ...listFacets(db), containers: listContainers(db) });
  });

  app.get('/api/containers', (_req, res) => {
    res.json(listContainers(db));
  });

  app.get('/api/items', (req, res) => {
    res.json(searchItems(db, searchOptionsFrom(req)));
  });

  app.get('/api/stacks', (req, res) => {
    res.json(listStacks(db, searchOptionsFrom(req)));
  });

  /**
   * The current filters as a file. Excel on Windows reads a UTF-8 CSV as
   * mojibake unless it starts with a BOM, and storage units get named in
   * whatever language their owner speaks, so the download carries one.
   */
  app.get('/api/export', (req, res) => {
    const format = req.query.format === 'json' ? 'json' : 'csv';
    const data = collectExport(db, searchOptionsFrom(req));
    const body = format === 'json' ? exportJson(data) : `\ufeff${exportCsv(data)}`;

    res.setHeader(
      'Content-Type',
      format === 'json' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename(format)}"`);
    res.send(body);
  });

  app.get('/api/events', (req, res) => {
    res.json(recentEvents(db, int(req.query.limit, 200)));
  });

  app.get('/api/sync', (_req, res) => {
    res.json(runner.getStatus());
  });

  app.post('/api/sync', (_req: Request, res: Response) => {
    if (runner.isRunning) {
      res.status(409).json({ error: 'A sync is already running', status: runner.getStatus() });
      return;
    }
    res.json(runner.start());
  });

  app.use(express.static(WEB_ROOT, { index: 'index.html' }));

  return app;
}

export interface ServerHandle {
  url: string;
  close: () => Promise<void>;
}

/** Binds to loopback only: this UI exposes the whole inventory unauthenticated. */
export function startServer(db: Db, config: Config): Promise<ServerHandle> {
  const app = createApp(db, config);
  return new Promise((resolve) => {
    const server = app.listen(config.port, '127.0.0.1', () => {
      resolve({
        url: `http://127.0.0.1:${config.port}`,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}
