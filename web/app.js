const PAGE_SIZE = 100;

const state = {
  view: 'items',
  query: '',
  container: null,
  location: 'all',
  category: '',
  rarity: '',
  stattrak: false,
  sort: 'name',
  page: 0,
  containers: [],
};

const $ = (id) => document.getElementById(id);
const containerLabels = new Map();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function queryString(extra = {}) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.container) params.set('container', state.container);
  if (state.location !== 'all') params.set('location', state.location);
  if (state.category) params.set('category', state.category);
  if (state.rarity) params.set('rarity', state.rarity);
  if (state.stattrak) params.set('stattrak', '1');
  params.set('sort', state.sort);
  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String(state.page * PAGE_SIZE));
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return params.toString();
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

function locationLabel(containerId) {
  if (!containerId) return 'inventory';
  return containerLabels.get(containerId) ?? `unit ${containerId}`;
}

function renderStats(stats) {
  const cells = [
    ['Items', stats.totalItems],
    ['Loose', stats.looseItems],
    ['In units', stats.storedItems],
    ['Distinct', stats.distinctNames],
    ['Units', stats.containers],
  ];
  if (stats.unresolved > 0) cells.push(['Unnamed', stats.unresolved]);

  $('stats').replaceChildren(
    ...cells.map(([label, value]) => {
      const stat = el('div', 'stat');
      stat.append(el('b', null, value.toLocaleString()), el('span', null, label));
      return stat;
    }),
    (() => {
      const stat = el('div', 'stat');
      const when = stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : 'never';
      stat.append(el('b', null, ''), el('span', null, `Last sync: ${when}`));
      return stat;
    })(),
  );
}

function renderContainers() {
  const list = $('containers');
  const items = [];

  const allButton = el('button', state.container === null ? 'is-active' : null, 'Everything');
  allButton.addEventListener('click', () => {
    state.container = null;
    state.page = 0;
    refresh();
  });
  const allItem = el('li');
  allItem.append(allButton);
  items.push(allItem);

  for (const container of state.containers) {
    const button = el('button', state.container === container.asset_id ? 'is-active' : null);
    button.append(document.createTextNode(container.label));
    const short = container.stored_count < container.contained_count;
    const count = el('span', short ? 'count short' : 'count',
      `${container.stored_count}/${container.contained_count}`);
    if (short) count.title = 'Some items in this unit have not been read yet';
    button.append(count);
    button.addEventListener('click', () => {
      state.container = state.container === container.asset_id ? null : container.asset_id;
      state.page = 0;
      refresh();
    });
    const li = el('li');
    li.append(button);
    items.push(li);
  }
  list.replaceChildren(...items);
}

/** Item art is served by Steam's CDN, which may simply be unreachable. */
function thumbnail(url) {
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

function itemRow(item) {
  const row = el('div', 'row');
  if (item.rarity_color) row.style.borderLeftColor = item.rarity_color;

  const thumb = thumbnail(item.image_url);

  const name = el('div', 'name');
  const title = el('div', 'title');
  title.append(document.createTextNode(item.market_hash_name));
  if (item.stattrak) title.append(el('span', 'badge st', 'ST'));
  if (item.custom_name && !item.is_container) {
    title.append(el('span', 'badge', `"${item.custom_name}"`));
  }
  const sub = [item.rarity_name, item.category].filter(Boolean).join(' - ');
  name.append(title, el('div', 'sub', sub));

  const float = el('div', 'float', item.float_value === null ? '' : item.float_value.toFixed(6));

  const where = el('div', item.container_id ? 'where' : 'where loose', locationLabel(item.container_id));

  row.append(thumb, name, float, where);
  return row;
}

function stackRow(stack) {
  const row = el('div', 'row');
  if (stack.rarity_color) row.style.borderLeftColor = stack.rarity_color;

  const thumb = thumbnail(stack.image_url);

  const name = el('div', 'name');
  name.append(
    el('div', 'title', stack.market_hash_name),
    el('div', 'sub', `across ${stack.containers} location${stack.containers === 1 ? '' : 's'}`),
  );

  row.append(thumb, name, el('div', 'float', `x${stack.count}`), el('div', 'where', ''));
  row.addEventListener('click', () => {
    $('q').value = stack.market_hash_name;
    state.query = stack.market_hash_name;
    state.view = 'items';
    state.page = 0;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === 'items'));
    refresh();
  });
  return row;
}

function eventRow(event) {
  const row = el('div', 'row');
  const name = el('div', 'name');
  const where =
    event.type === 'moved'
      ? `${locationLabel(event.from_container)} -> ${locationLabel(event.to_container)}`
      : locationLabel(event.type === 'removed' ? event.from_container : event.to_container);
  name.append(
    el('div', 'title', event.market_hash_name ?? event.asset_id),
    el('div', 'sub', where),
  );
  row.append(el('div'), name, el('div', 'float', event.type), el('div', 'where', new Date(event.ts).toLocaleString()));
  return row;
}

async function refresh() {
  renderContainers();
  const rows = $('rows');

  if (state.view === 'changes') {
    const events = await getJson('/api/events?limit=200');
    $('result-count').textContent = `${events.length} recent changes`;
    $('page-label').textContent = '';
    rows.replaceChildren(
      ...(events.length ? events.map(eventRow) : [el('div', 'empty', 'No changes recorded yet.')]),
    );
    return;
  }

  if (state.view === 'stacks') {
    const data = await getJson(`/api/stacks?${queryString()}`);
    $('result-count').textContent = `${data.total.toLocaleString()} distinct items`;
    $('page-label').textContent = `Page ${state.page + 1}`;
    rows.replaceChildren(
      ...(data.rows.length ? data.rows.map(stackRow) : [el('div', 'empty', 'Nothing matches.')]),
    );
    return;
  }

  const data = await getJson(`/api/items?${queryString()}`);
  $('result-count').textContent = `${data.total.toLocaleString()} items`;
  $('page-label').textContent = `Page ${state.page + 1} of ${Math.max(1, Math.ceil(data.total / PAGE_SIZE))}`;
  rows.replaceChildren(
    ...(data.items.length ? data.items.map(itemRow) : [el('div', 'empty', 'Nothing matches.')]),
  );
}

async function loadFacets() {
  const facets = await getJson('/api/facets');
  state.containers = facets.containers;
  containerLabels.clear();
  for (const container of facets.containers) containerLabels.set(container.asset_id, container.label);

  const fill = (select, values) => {
    const first = select.firstElementChild;
    select.replaceChildren(first);
    for (const value of values) {
      const option = el('option', null, value);
      option.value = value;
      select.append(option);
    }
  };
  fill($('category'), facets.categories);
  fill($('rarity'), facets.rarities);
}

async function pollSync({ onlyIfRunning = false } = {}) {
  const status = await getJson('/api/sync');
  if (onlyIfRunning && status.state !== 'running') return;
  const bar = $('syncbar');

  if (status.state === 'running') {
    bar.hidden = false;
    $('syncmsg').textContent = status.messages.at(-1) ?? 'starting';
    $('sync').disabled = true;
    setTimeout(pollSync, 1000);
    return;
  }

  $('sync').disabled = false;
  if (status.state === 'failed') {
    bar.hidden = false;
    $('syncmsg').textContent = `Sync failed: ${status.error}`;
    return;
  }
  if (status.state === 'done') {
    bar.hidden = false;
    const summary = status.summary;
    $('syncmsg').textContent = summary
      ? `Sync finished: ${summary.totalItems} items across ${summary.containers.length} storage units`
      : 'Sync finished';
    await loadFacets();
    await Promise.all([refresh(), getJson('/api/stats').then(renderStats)]);
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function wireControls() {
  $('q').addEventListener(
    'input',
    debounce((event) => {
      state.query = event.target.value;
      state.page = 0;
      refresh();
    }, 180),
  );

  for (const [id, key] of [['category', 'category'], ['rarity', 'rarity'], ['location', 'location'], ['sort', 'sort']]) {
    $(id).addEventListener('change', (event) => {
      state[key] = event.target.value;
      state.page = 0;
      refresh();
    });
  }

  $('stattrak').addEventListener('change', (event) => {
    state.stattrak = event.target.checked;
    state.page = 0;
    refresh();
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      state.view = tab.dataset.view;
      state.page = 0;
      refresh();
    });
  });

  $('prev').addEventListener('click', () => {
    if (state.page > 0) {
      state.page -= 1;
      refresh();
    }
  });
  $('next').addEventListener('click', () => {
    state.page += 1;
    refresh();
  });

  $('sync').addEventListener('click', async () => {
    $('sync').disabled = true;
    const response = await fetch('/api/sync', { method: 'POST' });
    if (!response.ok && response.status !== 409) {
      const body = await response.json().catch(() => ({}));
      $('syncbar').hidden = false;
      $('syncmsg').textContent = body.error ?? 'Could not start a sync';
      $('sync').disabled = false;
      return;
    }
    pollSync();
  });
}

async function main() {
  wireControls();
  await loadFacets();
  renderStats(await getJson('/api/stats'));
  await refresh();
  await pollSync({ onlyIfRunning: true });
}

main().catch((error) => {
  document.getElementById('rows').replaceChildren(
    Object.assign(document.createElement('div'), { className: 'empty', textContent: error.message }),
  );
});
