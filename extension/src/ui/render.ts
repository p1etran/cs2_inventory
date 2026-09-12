import type {
  ContainerRow,
  EventRow,
  StackRow,
  Stats,
  StoredItem,
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

export function itemRow(item: StoredItem, labels: Map<string, string>): HTMLElement {
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

/** What to say when a filter matches nothing, which depends on why. */
export function emptyMessage(options: { hasIndex: boolean; hasQuery: boolean }): string {
  if (!options.hasIndex) return 'Nothing indexed yet. Press "Sync" to read your inventory.';
  return options.hasQuery ? 'Nothing matches that search.' : 'Nothing here.';
}
