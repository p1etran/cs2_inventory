import { formatMoney, type PriceTable } from '../prices.js';
import type { PreviewItem, PreviewUnit } from '../steam/publicinventory.js';
import type {
  ContainerRow,
  EventRow,
  StackRow,
  Stats,
  StoredItem,
  SyncRun,
} from '../store.js';

/**
 * Turning stored rows into DOM.
 *
 * Ported from `web/app.js`, which renders the same shapes for the local
 * server. The markup and classes are deliberately identical so `web/style.css`
 * works unchanged; what differs is the source -- these take values straight
 * out of the store instead of JSON over HTTP, and the field names are the
 * domain's camelCase rather than SQL's snake_case.
 *
 * Everything is built with `createElement` and `textContent`. An item name is
 * whatever a player typed into a name tag, so it is never interpolated into
 * markup.
 */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string | null,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Names units by their label, so rows read "cases - p1" rather than an id. */
export function locationLabel(containerId: string | null, labels: Map<string, string>): string {
  if (!containerId) return 'inventory';
  return labels.get(containerId) ?? `unit ${containerId}`;
}

export function renderStats(stats: Stats): HTMLElement[] {
  const cells: [string, number][] = [
    ['Items', stats.totalItems],
    ['Loose', stats.looseItems],
    ['In units', stats.storedItems],
    ['Distinct', stats.distinctNames],
    ['Units', stats.containers],
  ];
  if (stats.unresolved > 0) cells.push(['Unnamed', stats.unresolved]);

  const tiles = cells.map(([label, value]) => {
    const stat = el('div', 'stat');
    stat.append(el('b', null, value.toLocaleString()), el('span', null, label));
    return stat;
  });

  const when = el('div', 'stat');
  when.append(
    el('b', null, ''),
    el('span', null, `Last sync: ${stats.lastSync ? new Date(stats.lastSync).toLocaleString() : 'never'}`),
  );
  tiles.push(when);
  return tiles;
}

export interface ContainerListOptions {
  containers: ContainerRow[];
  selected: string | null;
  onSelect: (assetId: string | null) => void;
  /** Set when prices are loaded, so units can show what they hold. */
  currency?: string;
}

export function renderContainers(options: ContainerListOptions): HTMLLIElement[] {
  const everything = el('button', options.selected === null ? 'is-active' : null, 'Everything');
  everything.addEventListener('click', () => options.onSelect(null));
  const first = el('li');
  first.append(everything);

  const rest = options.containers.map((container) => {
    const button = el('button', options.selected === container.assetId ? 'is-active' : null);
    button.append(document.createTextNode(container.label));

    /*
     * Both counts, always. A unit whose read was interrupted holds fewer items
     * than the game says, and showing only what we hold would make a partial
     * list look complete -- the one way this tool could quietly lie.
     */
    const short = container.storedCount < container.containedCount;
    const count = el(
      'span',
      short ? 'count short' : 'count',
      `${container.storedCount}/${container.containedCount}`,
    );
    if (short) count.title = 'Some items in this unit have not been read yet';
    button.append(count);

    if (container.value !== null && options.currency) {
      const value = el('span', 'unit-value', formatMoney(container.value, options.currency));
      if (short) {
        // The unit is worth at least this: the part we could not read is not
        // in the figure, and presenting it as a total would understate it.
        value.title = 'At least this much — some of this unit has not been read';
        value.textContent = `≥ ${value.textContent ?? ''}`;
      }
      button.append(value);
    }

    button.addEventListener('click', () =>
      options.onSelect(options.selected === container.assetId ? null : container.assetId),
    );
    const row = el('li');
    row.append(button);
    return row;
  });

  return [first, ...rest];
}

/** Item art comes from a CDN that may simply be unreachable. */
function thumbnail(url: string | null): HTMLElement {
  const wrapper = el('div');
  if (!url) return wrapper;
  const img = el('img');
  img.src = url;
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => img.remove());
  wrapper.append(img);
  return wrapper;
}

export function itemRow(
  item: StoredItem,
  labels: Map<string, string>,
  money?: { prices: PriceTable; currency: string },
): HTMLElement {
  const row = el('div', 'row');
  if (item.rarityColor) row.style.borderLeftColor = item.rarityColor;

  const name = el('div', 'name');
  const title = el('div', 'title');
  title.append(document.createTextNode(item.marketHashName));
  if (item.stattrak) title.append(el('span', 'badge st', 'ST'));
  if (item.customName && !item.isContainer) {
    title.append(el('span', 'badge', `"${item.customName}"`));
  }
  const sub = [item.rarityName, item.category].filter(Boolean).join(' - ');
  name.append(title, el('div', 'sub', sub));

  const float = el('div', 'float', item.floatValue === null ? '' : item.floatValue.toFixed(6));
  const where = el(
    'div',
    item.containerId ? 'where' : 'where loose',
    locationLabel(item.containerId, labels),
  );

  row.append(thumbnail(item.imageUrl), name, float, where);

  if (money) {
    const price = money.prices[item.marketHashName];
    // A dash, not a zero. An item with no market listing is not worthless,
    // it is unpriced, and the two should never look the same.
    row.append(
      el('div', price === undefined ? 'money none' : 'money',
        price === undefined ? '—' : formatMoney(price, money.currency)),
    );
  }
  return row;
}

export function stackRow(stack: StackRow, onPick: (name: string) => void): HTMLElement {
  const row = el('div', 'row');
  if (stack.rarityColor) row.style.borderLeftColor = stack.rarityColor;

  const name = el('div', 'name');
  name.append(
    el('div', 'title', stack.marketHashName),
    el('div', 'sub', `across ${stack.locations} location${stack.locations === 1 ? '' : 's'}`),
  );

  row.append(thumbnail(stack.imageUrl), name, el('div', 'float', `x${stack.count}`), el('div', 'where', ''));
  row.addEventListener('click', () => onPick(stack.marketHashName));
  return row;
}

export function eventRow(event: EventRow, labels: Map<string, string>): HTMLElement {
  const row = el('div', 'row');
  const name = el('div', 'name');

  const where =
    event.kind === 'moved'
      ? `${locationLabel(event.fromContainer, labels)} → ${locationLabel(event.toContainer, labels)}`
      : locationLabel(event.kind === 'removed' ? event.fromContainer : event.toContainer, labels);

  name.append(el('div', 'title', event.marketHashName || event.assetId), el('div', 'sub', where));
  row.append(
    el('div'),
    name,
    el('div', 'float', event.kind),
    el('div', 'where', new Date(event.at).toLocaleString()),
  );
  return row;
}

/**
 * The public inventory, shown before anyone has signed in.
 *
 * Marked as a preview throughout, because it genuinely is one: it has no float
 * values, no paint seeds, and -- the part that matters -- no way to see inside
 * a storage unit. Presenting it as the finished article would misrepresent
 * exactly the thing this tool exists to provide.
 */
export function previewRow(item: PreviewItem): HTMLElement {
  const row = el('div', 'row');
  if (item.rarityColor) row.style.borderLeftColor = item.rarityColor;

  const name = el('div', 'name');
  name.append(
    el('div', 'title', item.marketHashName),
    el('div', 'sub', [item.rarityName, item.category].filter(Boolean).join(' - ')),
  );

  row.append(thumbnail(item.imageUrl), name, el('div', 'float', `x${item.count}`), el('div', 'where', 'inventory'));
  return row;
}

export function previewUnitRow(unit: PreviewUnit): HTMLLIElement {
  const button = el('button');
  button.disabled = true;
  button.append(document.createTextNode(unit.label));
  // No stored count yet, and saying "0/818" would read as a failed read
  // rather than as one that has not happened.
  button.append(el('span', 'count', `${unit.containedCount}`));
  button.title = 'Sign in to see what is inside';

  const row = el('li');
  row.append(button);
  return row;
}

/**
 * What the inventory has been worth, one row per sync.
 *
 * A table rather than a chart. Twenty-odd syncs is not a shape worth drawing,
 * and the numbers are the point -- somebody checking a portfolio wants to read
 * the figure, not estimate it off an axis.
 */
export function portfolioRows(
  runs: readonly SyncRun[],
  currency: string,
): { rows: HTMLElement[]; empty: string | null } {
  const valued = runs.filter(
    (run): run is SyncRun & { value: number } => typeof run.value === 'number',
  );

  if (valued.length === 0) {
    return {
      rows: [],
      empty: 'No valued syncs yet. Load prices, then sync, and each one is recorded here.',
    };
  }

  const rows = valued.map((run, index) => {
    const row = el('div', 'row');
    const previous = valued[index + 1];
    const change = previous ? run.value - previous.value : null;

    const name = el('div', 'name');
    name.append(
      el('div', 'title', formatMoney(run.value, run.currency ?? currency)),
      el('div', 'sub', `${run.totalItems.toLocaleString()} items`),
    );

    const delta = el('div', 'float');
    if (change !== null) {
      // Sign always shown: "1200" and "+1200" mean different things on a row
      // that is otherwise just a number.
      delta.textContent = `${change >= 0 ? '+' : '-'}${formatMoney(Math.abs(change), run.currency ?? currency)}`;
      delta.className = `float ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`.trim();
    }

    row.append(el('div'), name, delta, el('div', 'where', new Date(run.at).toLocaleString()));
    return row;
  });

  return { rows, empty: null };
}

/** What to say when a filter matches nothing, which depends on why. */
export function emptyMessage(options: { hasIndex: boolean; hasQuery: boolean }): string {
  if (!options.hasIndex) return 'Nothing indexed yet. Press "Sync" to read your inventory.';
  return options.hasQuery ? 'Nothing matches that search.' : 'Nothing here.';
}

/**
 * The sign-in panel.
 *
 * This is the moment a new user decides whether to trust the extension, and
 * the honest framing is not "sign in here": no account is being handed over,
 * and there is nothing here to hand it to. Steam issues a session to this
 * browser, the way it would to a new PC, and the user revokes it in the same
 * place they would revoke that PC.
 *
 * A QR sign-in is also worth being suspicious of -- the scam version of this
 * screen shows a code generated for somebody else's session -- so the panel
 * names that attack itself rather than leaving the user to wonder. Nothing on
 * screen can distinguish the two, so it points at what can: the source, and
 * the network traffic the page is making while the code is on screen.
 *
 * `deviceName` is passed in rather than written here so the name the panel
 * promises is the one `auth.ts` actually sends to Steam.
 */
export function qrPanel(qr: Node, deviceName: string): HTMLElement[] {
  const heading = el('b', null, 'Authorize this browser');

  const frame = el('div');
  frame.id = 'qr';
  frame.append(qr);

  const lede = el(
    'p',
    'note lede',
    'This is not a sign-in to CS2 Inventory. You are giving this browser a Steam ' +
      'session, the same way you would give one to a new PC.',
  );

  const steps = el('ol', 'steps');
  for (const step of [
    'Open the Steam app on your phone.',
    'Tap the Steam Guard shield, then the QR scanner.',
    'Scan this code and approve it.',
  ]) {
    steps.append(el('li', null, step));
  }

  const note = el('p', 'note');
  note.append(
    document.createTextNode(
      'Your password and Steam Guard code never leave the Steam app. The session is ' +
        'issued to this browser, and there is no server here to send it to. It appears ' +
        'in Steam under Authorized devices as ',
    ),
    el('b', null, deviceName),
    document.createTextNode(', where you can revoke it at any time.'),
  );

  const disclosure = el('details', 'disclose');
  disclosure.append(
    el('summary', null, 'How do I know this code is really mine?'),
    el(
      'p',
      null,
      'Worth asking. The scam version of this screen shows you a code generated for ' +
        "someone else's session, so approving it signs them in as you. This code came " +
        "from this extension's own connection to Steam, and there is nowhere else for " +
        'it to go: the extension has no server, and Chrome permits it to reach only ' +
        "Steam's own hosts and GitHub for the public item-name list. You do not have " +
        'to take that on trust — open DevTools on this page and watch the Network tab ' +
        'while you scan.',
    ),
  );

  return [heading, el('div', null, ''), frame, lede, steps, note, disclosure];
}
