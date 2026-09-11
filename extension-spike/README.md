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

## Run it

1. Open `chrome://extensions`, turn on **Developer mode** (top right).
2. Click **Load unpacked** and pick this `extension-spike` folder.
3. Make sure you are logged in to `steamcommunity.com` in this browser.
4. Click the extension's icon, then **Run checks**.
5. Click **Copy report** and send it over.

No build step, no `npm install`.

## What it does and does not do

- Reads two cookies, calls Steam's public server-list endpoint, and opens a
  WebSocket which it closes again immediately **without sending any protocol**.
- **Never prints a token.** Only claim metadata is shown: the issuer, the
  account id, and the expiry date.
- Sends nothing anywhere. There is no server involved, and no analytics.
- Does not touch your inventory, and cannot: reading items needs protocol work
  this spike deliberately leaves out.

You can verify all of that — `popup.js` is about 250 lines of plain JavaScript
with no dependencies and no build step, so what you load is what you read.

## If a check fails

**No usable refresh token.** Almost always because "Remember me" was not ticked
at login. Sign out of Steam in this browser, sign in again with it ticked, and
re-run. If it still fails, the fallback is a QR-code sign-in through the Steam
mobile app — also no password.

**No CM server accepted a WebSocket.** If every attempt closes immediately,
Steam may be rejecting the extension origin. Send the report; that result would
change the plan rather than just delay it.
