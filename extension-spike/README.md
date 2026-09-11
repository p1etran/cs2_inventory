# Feasibility spike

A throwaway, read-only extension that answers the two questions the whole
browser-extension plan rests on. Nothing else should be built until both pass.

## Why this exists

Reading storage-unit contents needs an authenticated CS2 game-coordinator
session. A website cannot get one without asking you for a password or a pasted
token, because no web page may read `steamcommunity.com` cookies. An extension
can borrow the session already in your browser — **if** two things hold:

1. A usable Steam **refresh token** is readable from the browser's cookies.
   That token is what replaces the password, so no Steam Guard code is needed
   either.
2. Steam's **CM servers accept a WebSocket from an extension origin**. RFC 6455
   leaves origin checking up to the server, so this cannot be settled from
   documentation — it has to be tried.

## Status

**Question 1: answered, yes.** A run on a real account found
`steamRefresh_steam` on `login.steampowered.com`, issued by `steam`, valid for
54 more days. Signing in needs no password and no Steam Guard code.

**Question 2: still open.** The first revision got this wrong. It read each
server's `endpoint` field and ignored the rest of the record, so it fed TCP
endpoints (ports 27019–27024) to a `wss://` URL and read the resulting failures
as a rejection by Steam. Steam's directory mixes transports; a real client
filters on `realm == "steamglobal"` and `type == "websockets"`, and anything
that can only make ordinary HTTPS-shaped connections — a browser included —
also wants port 443. That last rule is `steam-user`'s `webCompatibilityMode`,
documented for use "through a firewall or a proxy".

This revision selects endpoints that way and adds a **control connection** to a
known-good public WebSocket host. Without the control, "Steam refused us" and
"WebSockets do not work here at all" look identical, which is what made the
first run inconclusive.

## Run it

1. Open `chrome://extensions`, turn on **Developer mode** (top right).
2. Click **Load unpacked** and pick this `extension-spike` folder. If it is
   already loaded from a previous run, click its **reload** icon instead.
3. Make sure you are logged in to `steamcommunity.com` in this browser.
4. Click the extension's icon, then **Run checks**.
5. Click **Copy report** and send it over.

No build step, no `npm install`.

## What it does and does not do

- Reads two cookies, calls Steam's public server-list endpoint, and opens
  WebSockets which it closes again immediately **without sending any
  protocol**.
- **Never prints a token.** Only claim metadata is shown: the issuer, the
  account id, and the expiry date.
- Sends nothing anywhere. There is no server involved, and no analytics.
- Does not touch your inventory, and cannot: reading items needs protocol work
  this spike deliberately leaves out.

You can verify all of that — `popup.js` is plain JavaScript with no
dependencies and no build step, so what you load is what you read.

The two `wss://` echo hosts in the manifest are there purely for the control
connection and are contacted with an empty socket that is closed at once.

## Reading the result

- **Steam accepted a WebSocket** — both gates pass, and the plan proceeds to
  making the shared core browser-safe.
- **Control worked but every Steam attempt failed** — a real finding about
  Steam, and it changes the plan. Send the report.
- **Control also failed** — inconclusive, and nothing has been learned about
  Steam. Something local is blocking WebSocket traffic: check for a firewall,
  proxy or VPN, then re-run.
- **No steamglobal WebSocket servers listed** — the directory returned a shape
  we did not expect. The report prints the type and realm tallies plus a sample
  record, which is enough to work out what changed.
