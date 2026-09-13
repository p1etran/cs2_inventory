# Feasibility spike

A throwaway, read-only extension that answers the questions the whole
browser-extension plan rests on.

## What is settled

**A usable refresh token is readable from the browser. PASSED.**
A run on a real account found `steamRefresh_steam` on
`login.steampowered.com`, issued by `steam`, valid for another 54 days.
Signing in needs **no password and no Steam Guard code** — the session already
in the browser is enough. This is the result that makes the product feel safe,
and it is now measured rather than assumed.

**WebSockets work from an extension page. PASSED.**
A control connection to a public echo host opened in 458ms.

**Steam's CM refuses a `chrome-extension://` origin.**
All four correctly-selected endpoints (`type: websockets`, `realm:
steamglobal`, port 443) closed with code 1006 in 141–177ms. That is fast
enough that Steam answered and refused, rather than the connection failing to
establish. The certificate is not the cause: the real cert is
`*.steamserver.net`, valid for those hosts.

## The open question

Browsers force an `Origin` header onto every WebSocket handshake and page
JavaScript cannot remove it. Steam appears not to like ours. This revision
tries the two things an extension can do that a web page cannot:

- **Test A** — strip the `Origin` header outright with a declarative request
  rule. Chrome has been confirmed to accept such a rule for `websocket`
  requests, so this genuinely runs.
- **Test B** — open the socket from inside a `steamcommunity.com` tab, in the
  page's own world, so the handshake carries `Origin:
  https://steamcommunity.com` — one of Steam's own.

**Test B is the likelier winner.** The competing extension describes itself as
working "through Steam Community in your browser", which reads as a literal
description of this technique. If B is what works, it is also a point in
favour of the extension over a website, because a website could never do it.

## Run it

1. **Open `steamcommunity.com` in another tab** and leave it open, or Test B
   will be skipped.
2. Open `chrome://extensions`, turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder — or press its **reload** icon
   if it is already loaded. The permissions changed in this revision, so a
   reload is required.
4. Click the extension's icon, then **Run checks**.
5. Click **Copy report** and send it over.

No build step, no `npm install`.

## What it does and does not do

- Reads two cookies, calls Steam's public server-list endpoint, and opens
  WebSockets which it closes again immediately **without sending any
  protocol**.
- **Never prints a token.** Only claim metadata: issuer, account id, expiry.
- Sends nothing anywhere. No server, no analytics.
- Registers one request rule, scoped to `steamserver.net` sockets, and removes
  it again in a `finally` block.
- Injects one function into a `steamcommunity.com` tab, which opens a socket
  and closes it. It reads nothing from the page.
- Does not touch your inventory, and cannot: reading items needs protocol work
  this spike deliberately leaves out.

`popup.js` is plain JavaScript with no dependencies and no build step, so what
you load is what you read.

## Reading the result

The verdict names which route worked, and each implies a different shape:

- **Direct** — simplest possible: no header rules, no page injection.
- **Origin stripped (A)** — the extension declares one request rule and
  connects from its own service worker.
- **From a Steam tab (B)** — the reader runs inside a Steam tab. Viable, and
  it explains how the competitor works.
- **All three refused, control passed** — Steam rejects browser-originated
  sockets and the approach needs rethinking. That is a real finding, not a
  setback to work around.
- **Control failed** — inconclusive; something local is blocking WebSockets.
