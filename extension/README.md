# CS2 Inventory — browser extension

Indexes everything you own in CS2, storage units included, without a password
and without a server.

## Where this is up to

**Sign in by QR, then read one storage unit.** The extension opens a page,
shows a QR code to scan in the Steam mobile app, logs on to a Steam connection
manager over a WebSocket, reaches the CS2 game coordinator, lists the account's
storage units, and reads the contents of the fullest one -- naming each item
through the same code the local CLI uses.

To check it, run `node dist/cli.js containers` for the same account and compare
the item count and names. That comparison against the already-working Node path
is the strongest correctness signal available, which is why the local app is
worth keeping around during this work.

Next is the full sync: a loop over every unit, with reads spaced and a unit
that fails to read leaving its stored items untouched rather than reported as
removed. And a pre-sign-in view of the public inventory, so the extension shows
something real before asking for anything.

## Build and load

```bash
npm install
npm run build:extension
```

Then in Chrome: `chrome://extensions` → **Developer mode** → **Load unpacked**
→ pick `extension/dist`. Click the toolbar icon to open the page.

Run `npm run protos` only after a Steam protocol change; the generated files
are committed so a normal build does not need it.

## How it works, and the things that are not obvious

**Signing in: a QR code, never a password.** The page shows a code, you scan it
in the Steam mobile app and approve it, and Steam hands back a refresh token.
No password and no Steam Guard code ever reaches this extension, and the
sign-in appears in your Steam device list under its own name --
"CS2 Inventory (browser extension)" -- so it can be recognised and revoked
rather than masquerading as a PC.

The exchange runs over an ordinary connection-manager socket with no account
attached, because there is no account yet. That is what `CmClient.callService`
is for: `Authentication.BeginAuthSessionViaQR`, then polling
`PollAuthSessionStatus` until the token arrives. Steam rotates the challenge
while you reach for your phone, so the code is redrawn when it does — a stale
code fails silently, with the phone simply doing nothing.

**Why it cannot just borrow the browser's Steam session.** It tried, and the
section below records the measurement. Short version: the token behind a
browser session is issued for audience `['web']`, a game client needs
`['web', 'client']`, and no Steam API widens one.

**What is stored, and where.** One client refresh token, in
`chrome.storage.local` — per-profile, per-extension. It is never transmitted
anywhere except to Steam's own connection manager, and there is still no server
to transmit it to. This is a weaker claim than the "nothing is stored at all"
that held while the extension borrowed the browser's session, so it is stated
plainly rather than glossed. "Forget this sign-in" deletes it, and the token is
long-lived, so a scan is needed when it expires rather than on every visit.

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

## The finding that decides the product

**A browser-session logon cannot get a CS2 game coordinator session.** Measured
as completely as it can be from outside Valve:

| checked | result |
| --- | --- |
| Our hello bytes vs. the reference client's | byte-identical |
| Hellos actually sent | six over a minute, on a live socket |
| Steam's game slot | confirmed, `playing_app: 730` |
| Coordinator reachable | yes — it replies |
| Coordinator's answer | `NO_SESSION`, every time |
| Upgrading a `['web']` token to `['web','client']` | no such API exists |

So the request is right, it arrives, the account is in-game, and the
coordinator still refuses. The one remaining variable is the session's
audience: a browser refresh token is `['web']`, and a game client needs
`['web','client']`, which is fixed when the session begins and cannot be
widened afterwards — `GenerateAccessTokenForApp` renews within an audience and
takes no platform type.

That closes the no-login idea. Reading storage units needs a client-audience
token, which means credentials, a QR scan, or a mobile confirmation. Nothing
else reaches casket contents: the public inventory gives a unit's item count
and never its contents.

**What we send the coordinator is byte-identical to the reference client.**
`test/extension-reference-bytes.test.ts` rebuilds the hello and games-played
through steam-user's and globaloffensive's own generated codecs — the code the
working local CLI runs — and compares bytes. They match. So when the
coordinator answers `NO_SESSION`, it is not answering a malformed request, and
the remaining variable is what kind of session is asking.

**Both directions are traced.** Tracing only inbound messages left "is the
hello even being sent" unanswerable across two runs against the real
coordinator, so `send` logs too. A hello that cannot be sent is logged rather
than lost: it runs inside a timer, where an uncaught throw would disappear and
the connection would merely look ignored.

**A web-mode logon can play a game — measured.** This was open for two rounds.
Steam confirms the game slot as app 730 for a session logged on with a web
logon token, and the coordinator does reply. The pairing is mandatory in the
other direction, though: the same token offered with a desktop OS type and no
UI mode is refused with `InvalidPassword`. So the token and the web identity go
together, and there is no desktop fallback worth spending a logon on.

**Every message Steam sends is logged, by name.** Because Steam answers a
message it does not recognise with silence rather than an error, a protocol
mistake and a slow server are indistinguishable without it -- and `dispatch`
used to drop anything it had no handler for without a word. The name table is
generated from steam-user's enum (all ~1900 ids, ~60 kB) rather than the nine
we handle, since an unexpected message is by definition not one of those.

Steam also volunteers `ClientPlayingSessionState`, which says whether this
session actually holds the account's single game slot. That one message is what
separates "the coordinator is slow" from "we never went in-game", so the
timeout now reports which of those happened instead of guessing.

The same blind spot existed one level down, and cost a round: `GcClient` also
dropped any coordinator message it had no handler for, and returned silently
when an envelope's appid did not match. A reply did arrive and was discarded
unseen. Coordinator messages are now traced by name too — from
globaloffensive's own table, all 267 of them — and every discard says so.

**The coordinator can queue you, and says so in a message that is not a
welcome.** `CMsgConnectionStatus` carries a status plus `queue_position`,
`queue_size` and an estimated wait. `NO_SESSION_IN_LOGON_QUEUE` is not the
coordinator being down, so the wait now extends while it keeps reporting a
position (capped at ten minutes), and a timeout while queued says so rather
than suggesting the account might not own CS2. `ClientLogonFatalError` is the
opposite case and fails immediately with the reason Valve gave.

**Steam ignores a message it does not recognise.** There is no error, so a
wrong message id shows up as silence. Games-played was being sent as EMsg 742
(`ClientGamesPlayed`), which Steam no longer acts on: the account stayed not
in-game, so the CS2 coordinator ignored every hello and never replied. The
working id is 5410 (`ClientGamesPlayedWithDataBlob`), which is the only one
steam-user sends. The hello also has to report a `version` -- an empty one gets
no answer either.

Because that whole class of mistake is invisible on the wire,
`test/extension-emsg.test.ts` checks every id and result code against
steam-user's enums rather than trusting the transcription. It found four wrong
`EResult` codes on its first run: `Busy` was really `Pending`, `Revoked` was
`AlreadyRedeemed`, `TryAnotherCM` was `IPTInitError`, and
`AccountLoginDeniedNeedTwoFactor` was `AccountLogonDenied`. Each would have
explained a logon failure as the wrong thing.

**A bundler renames anything that is not an export.** esbuild emits the
generated `CMsgClientHello` class as `CMsgClientHello2` to avoid a collision,
so `type.name` is `"CMsgClientHello2"` in the built extension. `encode` guards
against misspelled field names — protobufjs drops an unrecognised key silently,
which would send a message missing that value — and that guard looked the
message up by `type.name`, so it found nothing and skipped the check in every
build. Its unit test passed throughout, because vitest loads modules unbundled
with the names intact.

Two things came out of it. The lookup now goes through export names, which are
the module's public surface and survive bundling. And `test/extension-bundle.test.ts`
bundles before asserting, so anything that depends on a runtime name surviving
the build is checked against the artifact that actually ships rather than
against the source.

## Permissions, and why each is there

| Permission | Why |
| --- | --- |
| `steamcommunity.com` | Reading the public inventory, which needs no sign-in. |
| `declarativeNetRequestWithHostAccess` | The one `Origin` rule above. Host-scoped: it cannot touch a request to a host the extension has no permission for. |
| `*.steamserver.net` | The connection-manager WebSocket, which carries both the QR sign-in and the game-coordinator traffic. |
| `api.steampowered.com` | Steam's public server list. |
| `raw.githubusercontent.com` | The public CS2 item schema, used to name items. |
| `storage` | The index and the saved sign-in, both local. |

Adding QR sign-in needed **no new permission**: the exchange runs over the
connection-manager socket the extension already used, and the token goes into
the `storage` it already had.

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
      auth.ts         QR sign-in: begin a session, poll until approved
      cm.ts           connection manager client: connect, log on, service calls
      gc.ts           game coordinator: shared object cache, storage unit reads
      tokens.ts       the saved sign-in, and judging one before using it
      frame.ts        net message framing, Multi inflation
      protos.ts       encode/decode helpers
      servers.ts      server selection
      session.ts      exchanges the browser session for a logon token
      emsg.ts         the message ids and result codes used
    ui/
      qr.ts           draws the sign-in QR code as inline SVG
```

Item naming and inventory reconciliation are not duplicated here — they come
from `src/core.ts` in the repository root, which is the same code the local
CLI uses and is kept browser-safe by `test/portability.test.ts`.
