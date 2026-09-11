# CS2 Inventory — browser extension

Indexes everything you own in CS2, storage units included, without a password
and without a server.

## Where this is up to

**Milestone 2a: connect to Steam and log on.** The extension opens a page,
reads the Steam session already in your browser, connects to a Steam
connection manager over a WebSocket, and logs on. It reports the account it
logged on as, and stops there.

Reading storage units comes next (milestone 2b). If 2a reports the right
account then server selection, the `Origin` rule, message framing, protobuf
decoding, Multi inflation and the logon exchange are all correct, so anything
that fails afterwards belongs to the game coordinator rather than the
connection.

## Build and load

```bash
npm install
npm run build:extension
```

Then in Chrome: `chrome://extensions` → **Developer mode** → **Load unpacked**
→ pick `extension/dist`. Click the toolbar icon to open the page.

Run `npm run protos` only after a Steam protocol change; the generated files
are committed so a normal build does not need it.

## How it works, and the two things that are not obvious

**No password.** `steamcommunity.com/chat/clientjstoken` takes the session
cookies the browser already sends and returns a short-lived *web logon token*,
plus the account name and SteamID. That token is what
`CMsgClientLogon.web_logon_nonce` is for, and it is the supported way to log a
web session on to the connection manager.

Two things follow from that, both good: no cookie is ever read, so the
`cookies` permission is not needed; and the long-lived refresh token never
leaves the cookie jar -- only a short-lived token reaches Steam, and nothing is
stored.

An earlier attempt read the refresh token out of the `steamRefresh_steam`
cookie and offered it as `access_token`. Steam refused it with
`InvalidPassword`: a token minted for a browser is not one a game client may
log on with, and Valve is right not to let a web session escalate itself.

**Steam refuses a WebSocket that carries an `Origin` header.** Browsers attach
one to every handshake and page JavaScript cannot remove it. Measured: from an
extension origin the socket closes in ~150 ms with code 1006, and with the
header stripped the very same endpoint accepts it in ~440 ms. So the extension
registers one `declarativeNetRequest` rule removing `Origin` for
`steamserver.net` WebSocket requests, scoped so it cannot affect anything
else, and removes it again when the page closes. This is a game-client
transport, where no real client has ever sent an `Origin`; nothing about
extensions is being singled out.

Two consequences worth knowing:

- A website cannot do this at all, on two counts: no cookie access, and no way
  to drop that header.
- The connection lives in the page, not the service worker. The rule is only
  proven to apply to sockets opened from a page, and a sync that takes minutes
  has no business in a worker Chrome may evict. The trade is that the tab stays
  open while a sync runs.

**Protobuf codecs are precompiled.** protobufjs builds its codecs by calling
`Function(source)`, and an extension page runs under `script-src 'self'` with
no `unsafe-eval`, so a descriptor loaded at runtime throws the first time
anything is encoded. `extension/scripts/gen-protos.mjs` therefore compiles a
static module — plain encode/decode functions, no eval. This was found by
loading the extension, not by reading about it.

## Permissions, and why each is there

| Permission | Why |
| --- | --- |
| `steamcommunity.com` | Exchange the signed-in session for a short-lived logon token. Never a password. |
| `declarativeNetRequestWithHostAccess` | The one `Origin` rule above. Host-scoped: it cannot touch a request to a host the extension has no permission for. |
| `*.steamserver.net` | The connection-manager WebSocket. |
| `api.steampowered.com` | Steam's public server list. |
| `raw.githubusercontent.com` | The public CS2 item schema, used to name items. |
| `storage` | The index, kept locally. |

Not requested: `cookies` (nothing is read -- the browser attaches the session
itself), `tabs` (finding an already-open tab would mean asking to read your
browsing history, a bad trade for avoiding a duplicate tab), `scripting`, and
`offscreen`.

No server, no analytics, no remote code. Nothing leaves the browser except
traffic to Valve and the item schema. The build is unminified on purpose so
that claim can be checked against the source.

## Layout

```
extension/
  manifest.json
  scripts/
    gen-protos.mjs    generates the protobuf static module from Valve's .proto files
    build.mjs         bundles into extension/dist
  src/
    app.html, app.ts  the page; holds the Steam connection
    background.ts     opens the page when the toolbar icon is clicked
    steam/
      cm.ts           connection manager client: connect, log on, heartbeat
      frame.ts        net message framing, Multi inflation
      protos.ts       encode/decode helpers
      servers.ts      server selection
      session.ts      exchanges the browser session for a logon token
      emsg.ts         the message ids and result codes used
```

Item naming and inventory reconciliation are not duplicated here — they come
from `src/core.ts` in the repository root, which is the same code the local
CLI uses and is kept browser-safe by `test/portability.test.ts`.
