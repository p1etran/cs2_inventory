import { Catalog, readCasketId, type CatalogIndex } from '../../src/core.js';
import { DEVICE_NAME, signInWithQr } from './steam/auth.js';
import { CmClient, removeOriginRule } from './steam/cm.js';
import { GcClient, type GcEconItem } from './steam/gc.js';
import {
  BulkPriceSource,
  describeAge,
  formatMoney,
  loadPrices,
  savePrices,
  valueOf,
  type PriceData,
} from './prices.js';
import { machineId } from './steam/machineid.js';
import { readPublicInventory, type InventoryPreview } from './steam/publicinventory.js';
import { readSteamSession } from './steam/session.js';
import { forgetSession, inspectToken, loadSession, saveSession } from './steam/tokens.js';
import { Store, type SearchOptions } from './store.js';
import { runSync } from './sync.js';
import { CollapsingLog } from './ui/log.js';
import { renderQrSvg } from './ui/qr.js';
import {
  el,
  emptyMessage,
  eventRow,
  itemRow,
  previewRow,
  previewUnitRow,
  portfolioRows,
  qrPanel,
  renderContainers,
  renderStats,
  stackRow,
} from './ui/render.js';

/**
 * The page.
 *
 * Everything it shows comes from the local index, so it is useful the moment
 * it opens and needs no connection to browse -- a sync is a thing you press,
 * not a thing you wait for. Naming and reconciliation are not reimplemented
 * here: `src/core.ts` is the same code the local CLI uses.
 */

const PAGE_SIZE = 100;

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const store = new Store();
const log = new CollapsingLog($('log'));
const write = (text: string, cls = ''): void => log.write(text, cls);

const state = {
  query: '',
  container: null as string | null,
  location: 'all' as NonNullable<SearchOptions['location']>,
  category: '',
  rarity: '',
  stattrak: false,
  sort: 'name' as NonNullable<SearchOptions['sort']>,
  view: 'items' as 'items' | 'stacks' | 'changes' | 'portfolio',
  page: 0,
  syncing: false,
  /** The public inventory, shown only until there is a real index. */
  preview: null as InventoryPreview | null,
  prices: null as PriceData | null,
};

/** Unit labels by asset id, so rows can say where an item lives. */
const labels = new Map<string, string>();

function currentOptions(): SearchOptions {
  return {
    query: state.query || undefined,
    containerId: state.container ?? undefined,
    location: state.location,
    category: state.category || undefined,
    rarity: state.rarity || undefined,
    stattrak: state.stattrak || undefined,
    sort: state.sort,
    limit: PAGE_SIZE,
    offset: state.page * PAGE_SIZE,
    prices: state.prices?.prices,
  };
}

function render(): void {
  if (store.items.length === 0 && state.preview) {
    renderPreview(state.preview);
    return;
  }

  const money = state.prices
    ? { prices: state.prices.prices, currency: state.prices.currency }
    : undefined;

  const containers = store.listContainers(money?.prices);
  labels.clear();
  for (const container of containers) labels.set(container.assetId, container.label);

  $('stats').replaceChildren(...renderStats(store.getStats()), ...valueTile(money));
  $('containers').replaceChildren(
    ...renderContainers({
      containers,
      selected: state.container,
      currency: money?.currency,
      onSelect: (assetId) => {
        state.container = assetId;
        state.page = 0;
        render();
      },
    }),
  );

  const rows = $('rows');
  let total = 0;
  let shown = 0;

  if (state.view === 'portfolio') {
    const { rows: built, empty } = portfolioRows(store.runs, money?.currency ?? 'USD');
    total = built.length;
    shown = built.length;
    rows.replaceChildren(...(built.length > 0 ? built : [el('div', 'empty', empty ?? '')]));
  } else if (state.view === 'changes') {
    const events = store.recentEvents(200);
    total = events.length;
    shown = events.length;
    rows.replaceChildren(...events.map((event) => eventRow(event, labels)));
  } else if (state.view === 'stacks') {
    const result = store.listStacks(currentOptions());
    total = result.total;
    shown = result.rows.length;
    rows.replaceChildren(
      ...result.rows.map((stack) =>
        stackRow(stack, (name) => {
          // Picking a stack drills into the items behind it, which is what
          // clicking a group is for.
          ($('q') as HTMLInputElement).value = name;
          state.query = name;
          state.view = 'items';
          state.page = 0;
          syncTabs();
          render();
        }),
      ),
    );
  } else {
    const result = store.search(currentOptions());
    total = result.total;
    shown = result.items.length;
    rows.replaceChildren(...result.items.map((item) => itemRow(item, labels, money)));
  }

  if (shown === 0 && state.view !== 'portfolio') {
    rows.replaceChildren(
      el(
        'div',
        'empty',
        emptyMessage({ hasIndex: store.items.length > 0, hasQuery: state.query !== '' }),
      ),
    );
  }

  const noun =
    state.view === 'stacks'
      ? 'groups'
      : state.view === 'changes'
        ? 'changes'
        : state.view === 'portfolio'
          ? 'valued syncs'
          : 'items';
  $('result-count').textContent = total ? `${total.toLocaleString()} ${noun}` : '';

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = state.view === 'items' || state.view === 'stacks';
  $('page-label').textContent = paged && total > PAGE_SIZE ? `Page ${state.page + 1} of ${pages}` : '';
  ($('prev') as HTMLButtonElement).disabled = !paged || state.page === 0;
  ($('next') as HTMLButtonElement).disabled = !paged || state.page + 1 >= pages;
}

/**
 * The page before anyone has signed in.
 *
 * Deliberately the same layout as the real thing, with the filters disabled
 * and every unit showing a count it cannot open. Somebody should see their own
 * inventory before being asked to scan anything -- and should be able to tell
 * at a glance what signing in would add.
 */
function renderPreview(preview: InventoryPreview): void {
  const stats: [string, string][] = [
    ['Loose items', preview.looseCount.toLocaleString()],
    ['In units', preview.storedCount.toLocaleString()],
    ['Units', String(preview.units.length)],
    ['Distinct', preview.items.length.toLocaleString()],
  ];
  $('stats').replaceChildren(
    ...stats.map(([label, value]) => {
      const tile = el('div', 'stat');
      tile.append(el('b', null, value), el('span', null, label));
      return tile;
    }),
  );

  $('containers').replaceChildren(...preview.units.map(previewUnitRow));

  const matching = state.query
    ? preview.items.filter((item) =>
        state.query
          .toLowerCase()
          .split(/\s+/)
          .every((word) => item.marketHashName.toLowerCase().includes(word)),
      )
    : preview.items;

  $('rows').replaceChildren(...matching.slice(0, PAGE_SIZE).map(previewRow));
  $('result-count').textContent = `${matching.length.toLocaleString()} kinds of item in your loose inventory`;
  $('page-label').textContent = '';
  ($('prev') as HTMLButtonElement).disabled = true;
  ($('next') as HTMLButtonElement).disabled = true;
}

/**
 * The total, and honestly what it excludes.
 *
 * An inventory always contains things with no market listing, so the figure is
 * a floor rather than a valuation, and the tile says how many items are not in
 * it. A bare total invites trusting a number that is too low.
 */
function valueTile(money?: { prices: Record<string, number>; currency: string }): HTMLElement[] {
  if (!money) return [];

  const live = store.items.filter((item) => item.removedAt === null && !item.isContainer);
  const value = valueOf(live, money.prices);

  const tile = el('div', 'stat');
  tile.append(
    el('b', null, formatMoney(value.total, money.currency)),
    el('span', null, value.unpriced > 0 ? `Value (${value.unpriced.toLocaleString()} unpriced)` : 'Value'),
  );
  if (value.unpriced > 0) {
    tile.title = `${value.unpriced.toLocaleString()} items have no market price, so the real total is higher.`;
  }
  return [tile];
}

function syncTabs(): void {
  for (const tab of document.querySelectorAll<HTMLElement>('.tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === state.view);
  }
}

function loadFacets(): void {
  const facets = store.listFacets();
  const fill = (id: string, values: string[], all: string, selected: string) => {
    const select = $(id) as HTMLSelectElement;
    select.replaceChildren(
      el('option', null, all),
      ...values.map((value) => {
        const option = el('option', null, value);
        option.value = value;
        return option;
      }),
    );
    (select.firstElementChild as HTMLOptionElement).value = '';
    select.value = selected;
  };
  fill('category', facets.categories, 'All types', state.category);
  fill('rarity', facets.rarities, 'All rarities', state.rarity);
}

function status(message: string, cls = ''): void {
  const bar = $('syncbar');
  bar.hidden = false;
  bar.className = `syncbar${cls ? ` ${cls}` : ''}`;
  $('syncmsg').textContent = message;
}

function showAccount(name: string): void {
  $('account').textContent = name ? `Signed in as ${name}` : '';
}

/** Loads the item schema and builds a catalog. */
async function loadCatalog(): Promise<Catalog> {
  const { buildCatalogIndex } = await import('../../src/core.js');
  const index = await buildCatalogIndex({
    onProgress: (message) => write(message, 'dim'),
    fetcher: async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return response.json();
    },
  });
  return new Catalog(index as CatalogIndex);
}

const casketIdOf = (item: GcEconItem): string | null => readCasketId(item.attribute);

function showQr(challengeUrl: string): void {
  const panel = $('signin');
  panel.hidden = false;
  panel.replaceChildren(...qrPanel(renderQrSvg(challengeUrl), DEVICE_NAME));
}

function hideQr(): void {
  $('signin').hidden = true;
  $('signin').replaceChildren();
}

async function ensureSignedIn(
  cm: CmClient,
): Promise<{ refreshToken: string; steamId: string; accountName: string }> {
  const saved = await loadSession();
  if (saved) {
    const token = inspectToken(saved.refreshToken);
    if (token.usable && token.steamId) {
      return {
        refreshToken: saved.refreshToken,
        steamId: token.steamId,
        accountName: saved.accountName,
      };
    }
    status(`Signing in again: ${token.problem}`);
  }

  status('Scan the QR code with the Steam app on your phone');
  cm.sayHello();

  const signedIn = await signInWithQr(cm, {
    onChallenge: (url) => showQr(url),
    onScanned: () => status('Scanned. Approve it on your phone.'),
  });
  hideQr();

  const token = inspectToken(signedIn.refreshToken);
  if (!token.usable || !token.steamId) {
    throw new Error(`Steam returned a sign-in we cannot use: ${token.problem}`);
  }

  await saveSession({ refreshToken: signedIn.refreshToken, accountName: signedIn.accountName });
  return {
    refreshToken: signedIn.refreshToken,
    steamId: token.steamId,
    accountName: signedIn.accountName,
  };
}

async function sync(): Promise<void> {
  if (state.syncing) return;
  state.syncing = true;
  ($('sync') as HTMLButtonElement).disabled = true;
  $('cancel').hidden = false;
  log.clear();

  const controller = new AbortController();
  const onCancel = () => controller.abort();
  $('cancel').addEventListener('click', onCancel, { once: true });

  let client: CmClient | null = null;

  try {
    status('Connecting to Steam...');
    client = new CmClient({ onLog: (message) => write(message, 'dim') });
    await client.connect();

    const { refreshToken, steamId, accountName } = await ensureSignedIn(client);
    const logon = await client.logOnWithToken(refreshToken, steamId, await machineId());
    showAccount(logon.personaName || accountName || logon.steamId);
    $('signout').hidden = false;

    status('Reaching the CS2 game coordinator...');
    const gc = new GcClient(client, { onLog: (message) => write(message, 'dim'), casketIdOf });
    await gc.connect();

    status('Loading the item schema...');
    const catalog = await loadCatalog();

    const summary = await runSync({
      gc,
      store,
      catalog,
      steamId: logon.steamId,
      signal: controller.signal,
      onProgress: (message) => {
        write(message, message.startsWith('  ') ? 'dim' : '');
        if (!message.startsWith('  ')) status(message);
      },
    });

    // Record what it was worth, so the value tab is a history rather than a
    // single number. Only when prices are actually loaded: a zero would draw
    // the portfolio line through the floor.
    if (state.prices) {
      const live = store.items.filter((item) => item.removedAt === null && !item.isContainer);
      const value = valueOf(live, state.prices.prices);
      store.noteRunValue(value.total, state.prices.currency);
      await store.save();
    }

    loadFacets();
    render();

    const changes =
      summary.added || summary.removed || summary.moved
        ? ` — ${summary.added} added, ${summary.removed} removed, ${summary.moved} moved`
        : '';

    /*
     * A failed unit is the one outcome worth interrupting for. Its contents
     * are still in the index from last time, so the page looks complete when
     * it is not, and silence would let stale data pass for fresh.
     */
    if (summary.failedContainers) {
      status(
        `${summary.failedContainers} storage unit${summary.failedContainers === 1 ? '' : 's'} could not be read. ` +
          'Their previous contents were kept. Sync again to retry.',
        'warn',
      );
      for (const container of summary.containers.filter((c) => c.error !== null)) {
        write(`${container.label}: ${container.error}`, 'bad');
      }
    } else {
      status(`Indexed ${summary.totalItems.toLocaleString()} items${changes}`, 'ok');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status(message, 'warn');
    write(message, 'bad');
  } finally {
    $('cancel').removeEventListener('click', onCancel);
    $('cancel').hidden = true;
    hideQr();
    client?.disconnect();
    ($('sync') as HTMLButtonElement).disabled = false;
    state.syncing = false;
  }
}

/**
 * The price source.
 *
 * A public bulk file: one request covers every item name, where Steam's own
 * endpoint is priced per name and rate-limited to roughly twenty a minute --
 * about an hour for this inventory. The host is an *optional* permission,
 * requested the first time somebody asks for prices, so the install prompt
 * stays to what the extension needs to do its actual job.
 */
const PRICE_URL = 'https://prices.csgotrader.app/latest/prices_v6.json';
const PRICE_HOST = 'https://prices.csgotrader.app/*';
const priceSource = new BulkPriceSource(PRICE_URL);

function showPriceAge(): void {
  $('prices').textContent = state.prices
    ? `Prices ${describeAge(state.prices)}`
    : '';
}

async function fetchPrices(): Promise<void> {
  const button = $('loadprices') as HTMLButtonElement;
  button.disabled = true;

  try {
    // Asked for at the moment it is needed, not at install time. Chrome
    // requires this to be called from a user gesture, which a click is.
    const granted = await chrome.permissions.request({ origins: [PRICE_HOST] });
    if (!granted) {
      status('Prices need permission to reach the price source. Nothing else changed.', 'warn');
      return;
    }

    status(`Loading prices from ${priceSource.name}...`);
    const prices = await priceSource.fetch(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return response.json();
    });

    const data = {
      prices,
      currency: priceSource.currency,
      fetchedAt: new Date().toISOString(),
      source: priceSource.name,
    };
    await savePrices(data);
    state.prices = { ...data, version: 1 };

    showPriceAge();
    render();
    status(
      `Loaded ${Object.keys(prices).length.toLocaleString()} prices from ${priceSource.name}`,
      'ok',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A price source is somebody else's free file; it going away must not
    // look like the extension breaking.
    status(`Could not load prices: ${message}. Everything else still works.`, 'warn');
  } finally {
    button.disabled = false;
  }
}

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function wireControls(): void {
  const rerender = () => {
    state.page = 0;
    render();
  };

  $('q').addEventListener(
    'input',
    debounce((event: Event) => {
      state.query = (event.target as HTMLInputElement).value.trim();
      rerender();
    }, 120),
  );

  for (const tab of document.querySelectorAll<HTMLElement>('.tab')) {
    tab.addEventListener('click', () => {
      state.view = (tab.dataset.view ?? 'items') as typeof state.view;
      state.page = 0;
      syncTabs();
      render();
    });
  }

  const bind = (id: string, apply: (value: string) => void) => {
    $(id).addEventListener('change', (event) => {
      apply((event.target as HTMLSelectElement).value);
      rerender();
    });
  };
  bind('category', (value) => (state.category = value));
  bind('rarity', (value) => (state.rarity = value));
  bind('location', (value) => (state.location = value as typeof state.location));
  bind('sort', (value) => (state.sort = value as typeof state.sort));

  $('stattrak').addEventListener('change', (event) => {
    state.stattrak = (event.target as HTMLInputElement).checked;
    rerender();
  });

  $('prev').addEventListener('click', () => {
    if (state.page > 0) {
      state.page -= 1;
      render();
    }
  });
  $('next').addEventListener('click', () => {
    state.page += 1;
    render();
  });

  $('sync').addEventListener('click', () => void sync());
  $('loadprices').addEventListener('click', () => void fetchPrices());

  $('details').addEventListener('click', () => {
    const pane = $('log');
    pane.hidden = !pane.hidden;
  });

  $('signout').addEventListener('click', () => {
    void forgetSession().then(() => {
      $('signout').hidden = true;
      showAccount('');
      status('Sign-in forgotten. The next sync will show a new QR code.');
    });
  });
}

async function main(): Promise<void> {
  wireControls();
  await store.load();
  loadFacets();
  render();

  state.prices = await loadPrices();
  showPriceAge();
  render();

  const saved = await loadSession();
  if (saved) {
    $('signout').hidden = false;
    showAccount(saved.accountName);
  }

  if (store.items.length > 0) return;

  status('Reading your public inventory...');
  try {
    // No sign-in for any of this: the browser already holds a Steam session,
    // and the public inventory is readable with it. What it cannot show is
    // what is inside a storage unit, which is what "Sync" is for.
    const session = await readSteamSession();
    state.preview = await readPublicInventory(session.steamId);
    render();
    status(
      `Showing your public inventory. ${state.preview.storedCount.toLocaleString()} items are inside ` +
        `${state.preview.units.length} storage units — press "Sync" to see what they are.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status(`Nothing indexed yet. Press "Sync" to read your inventory. (${message})`);
  }
}

// Leave no rule behind once the page goes away.
window.addEventListener('pagehide', () => void removeOriginRule());

void main();
