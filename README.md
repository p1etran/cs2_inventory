# cs2-inventory

A local index of everything you own in CS2 — **including the items inside your
storage units**.

Steam's public inventory API shows a storage unit as a single opaque item. If
you keep thousands of items across a pile of units, the web inventory and every
tool built on it can only tell you the units exist, not what is in them. This
tool reads them the way the game itself does, on your own machine, and gives you
one searchable list.

```
$ cs2inv find karambit fade
★ Karambit | Fade (Factory New)  0.021400
    in noże i rękawice
★ StatTrak™ Karambit | Fade (Minimal Wear)  0.089100
    in overpay junk
```

## Why it runs locally

Enumerating storage-unit contents requires an authenticated CS2 game-coordinator
session. There is no read-only Steam credential that grants this, which is why
hosted trackers ask you to hand over a Steam token — and why handing one over is
a bad trade: a refresh token is enough to act as you.

So this does not have a server. It is a program you run yourself:

- Your password is used **once**, to obtain a refresh token, and is never stored.
- The refresh token is written to `data/steam-session.json`, encrypted with a
  passphrase you choose (AES-256-GCM, scrypt-derived key), owner-readable only.
- The only host your credentials are ever sent to is Steam.
- The web UI binds to `127.0.0.1` and nothing else.

The one network call unrelated to Steam is downloading the public CS2 item
schema, so items can be given names. That request contains nothing about you.

## Install

Requires Node.js 20.11 or newer.

```bash
git clone https://github.com/p1etran/cs2_inventory.git
cd cs2_inventory
npm install
npm run build
```

## Use

```bash
node dist/cli.js login     # once
node dist/cli.js sync      # reads everything, including every storage unit
node dist/cli.js serve     # browse it at http://127.0.0.1:8733
```

To get a shorter `cs2inv` command, link the package once with `npm link` (on
Windows run the terminal as administrator, or just keep using `node
dist/cli.js` -- every command below works either way, and the tool prints
follow-up commands in whichever form you are using).

`login` asks for your account name and password, then throws the password
away. For the second factor you get **both routes at once**: approve the
sign-in in your Steam mobile app, or type the code from it -- whichever you do
first completes the login. Password and passphrase prompts echo an asterisk per
character; Ctrl+C cancels.

If you chose a passphrase, `sync` asks for it when it needs the saved token.
Set `CS2INV_PASSPHRASE` to skip that prompt.

### Commands

| Command | What it does |
| --- | --- |
| `login` | Sign in once and save an encrypted refresh token |
| `logout` | Delete the saved session |
| `sync` | Read the loose inventory and every storage unit |
| `find <query>` | Search everything and show which unit each match is in |
| `stats` | Totals from the last sync |
| `containers` | Storage units, and how much of each has been read |
| `changes` | What arrived, left or moved between syncs |
| `export --out items.csv` | Every item as CSV (`--json` for JSON) |
| `serve` | Local web UI |
| `catalog --force` | Redownload the item schema |

Useful flags: `--data-dir <path>`, `--limit <n>`, `--container <id>`, `--loose`,
`--json`, `--port <n>`, `--unresolved`, `--verbose` (prints the Steam client's
own log during login).

Search matches on every whitespace-separated word, in any order, against the
item name, its name tag, and **the label of the unit it sits in** — so
`cs2inv find overpay awp` lists the AWPs in the unit you named "overpay".

### The web UI

Search across the whole account, filter by type, rarity, exterior or storage
unit, group duplicates to see how many of something you own, and review what
changed between syncs. The sidebar shows each unit's fill level, turning amber
when a unit holds more than has been read.

`Sync` in the UI works when the session passphrase is available to the server
(`CS2INV_PASSPHRASE`); otherwise run `cs2inv sync` in a terminal.

## How it works

**Signing in.** `login` drives Steam's authentication directly rather than
through the Steam client library's own login helper, because that helper
cancels the authentication session the moment Steam asks for a second factor --
which makes approving a sign-in on your phone impossible, since the session
being approved has already been thrown away. Holding the session open means
Steam's own polling completes as soon as you tap approve, and a typed code is
submitted against that same session instead of starting a fresh attempt (so a
mistyped code does not fire off another phone notification).

**Reading storage units.** `sync` logs in to Steam, launches CS2 the way the
game client does, and asks the game coordinator for the account's items. Storage
units (item definition `1201`) report a contained-item count but not their
contents, so each one is loaded individually and its items come back tagged with
the unit's id. Reads are spaced out (`CS2INV_CASKET_DELAY_MS`, default 1100 ms)
and retried with backoff, because the coordinator throttles bursts.

**Naming items.** The coordinator sends raw economy items — a definition index,
a paint index, a float, and a bag of attributes — with no names at all. Names are
rebuilt from the public CS2 item schema, per family, because the same attribute
means different things on different items: "sticker slot 0 id" holds a sticker
kit on a sticker, a graffiti kit on a graffiti, and a patch kit on a patch,
while charms and souvenir-charm highlights use two different attributes whose id
ranges overlap. Exteriors come from the float, and StatTrak / Souvenir from the
item's quality, so `★ StatTrak™ Karambit | Fade (Factory New)` is assembled
rather than looked up.

Anything the schema cannot identify is still recorded, counted as "unnamed", and
findable with `cs2inv find --unresolved`; `cs2inv catalog --force` refreshes the
schema after a game update adds items.

**Tracking changes.** Asset ids survive moves in and out of storage units, so a
changed unit is recorded as a move rather than a delete plus an add. If a unit
fails to read, its items are deliberately left untouched — a failed read never
reports thousands of items as gone.

## Things worth knowing

- **It disconnects you from CS2.** An account gets one game-coordinator session,
  so syncing while you are in a match will drop you. Sync when you are not
  playing.
- **First sync is slow.** Roughly a second per storage unit, plus login. Twenty
  units take under a minute; the delay exists to avoid being throttled.
- **Trade holds and new items** land in the loose inventory and are picked up on
  the next sync like anything else.
- Data lives in `data/`, which is gitignored. Deleting it loses your history,
  not your items.

## Development

```bash
npm test           # 118 tests
npm run typecheck
npm run build
```

Tests cover name assembly, attribute decoding, catalog resolution for every item
family, the sync reconciliation rules, the sign-in flow (both the phone-approval
and typed-code routes), refresh-token validation, terminal prompt handling,
credential encryption and the HTTP API. Steam itself is faked, so the suite
needs no account and no network.

## Dependency audit

`npm audit` reports advisories in two transitive dependencies of `steam-user`:
`adm-zip` (used for Steam depot downloads) and `protobufjs` 6.x pinned by
`steam-appticket` (used for app-ownership tickets). Neither is on this app's
code path — it only logs in and reads its own items — and `steam-user` itself
resolves the patched `protobufjs` 7.x. `npm audit fix --force` "resolves" them
by downgrading to `steam-user@3.15.0`, which `globaloffensive` v3 cannot use, so
that fix is not applied here.

## Not included

Prices. The item list came first; valuation can sit on top of it later, since
every item is stored with the market hash name a price source needs.
