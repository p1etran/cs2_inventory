# Store listing

Copy for the Chrome Web Store submission, kept in the repo so it can be
reviewed like anything else. Everything factual here is checkable against the
source in the same commit.

---

## Name

CS2 Inventory

## Summary (132 characters max)

See inside your CS2 storage units. Every item you own, indexed and searchable
offline. No password.

## Category

Productivity

---

## Description

**If you keep thousands of CS2 items in storage units, you cannot search them.**
Steam shows a unit as a single item with a number on it. To find one knife you
open units one at a time and scroll.

This reads every storage unit you own and builds a searchable index of
everything inside, on your own machine.

**What it does**

- Reads your whole inventory, storage units included, in about a minute and a
  half for twenty-odd units.
- Search across all of it at once. Type "kara fade" and find the Karambit,
  wherever it is.
- Filter by type, rarity, StatTrak, or which unit something is in.
- See what changed since last time: what arrived, what left, what moved between
  units.
- Optionally load prices to see what it is all worth, per item, per storage
  unit, and over time.
- Works offline once indexed. Open it on a plane and your inventory is there.

**You never log in to this extension**

There is nothing here to log in to. No account, no API key, no token to paste,
and no server of ours to hand anything to.

Instead you authorize your own browser as a Steam device, by scanning a QR code
in the Steam mobile app — the same flow you would use to set up a new PC. Steam
issues the session to your browser. Your password and your Steam Guard code
never leave the Steam app.

That session appears in Steam under **Authorized devices** as
"CS2 Inventory (browser extension)", exactly like a PC you signed in on, and
you revoke it in the same place, yourself, whenever you want.

You do not scan on every visit. The sign-in lasts months, and searching your
index needs no sign-in at all. Before you sign in the first time, it already
shows your public inventory and your units' item counts.

**Where your data goes, and why that is not just a promise**

Nowhere. There is no server, no account, and no analytics. Your inventory index
and your Steam sign-in live in this browser profile and are never transmitted
anywhere except to Steam itself. Removing the extension removes them with it.

You do not have to believe that. Chrome enforces it. An extension can only
reach the hosts it declares up front, and you can read this one's list before
you install: Steam's servers, and GitHub for the public list of item names.
There is no permission here that would let it contact anybody else, it has no
access to your browsing, it reads no other tab, and it ships no remote code.

**Why an extension and not a website**

Because a website cannot do this. Reading a storage unit means talking to the
CS2 game coordinator the way the game does, and a web page cannot make that
connection — the browser attaches an `Origin` header to every connection it
opens, and Steam's servers refuse any that carries one. Only an extension can
remove it. That is a measured fact, not a preference, and it is written up in
the repository.

**Open source**

The full source is at https://github.com/p1etran/cs2_inventory. The published
build is unminified on purpose: you can read the code that is actually running,
not just the code we say is running.

---

## Questions people will actually ask

Blunt versions, answered plainly. Worth having ready for the listing, the
GitHub README, and every Reddit thread this gets posted in.

**Isn't signing in with a QR code how people get scammed?**

The scam is real, and it is worth understanding before you scan anything. It
works by showing you a QR code generated for *the attacker's* session: you
scan, you approve, and now they are signed in as you. The danger was never the
QR code — it is who generated the one you are looking at.

Which is why the answer here is not "trust us". This code comes from the
extension's own connection to Steam, and there is nowhere else it could go:
there is no server, and Chrome permits this extension to reach only Steam's own
hosts. You can watch that in DevTools while you scan, and the code that
requests it is a few dozen lines you can read.

**Can you steal my skins?**

No trade and no market listing can happen without a confirmation in your Steam
mobile app, and we have no way to produce one. We also never hold your session
— your browser does.

**What if you push a malicious update later?**

That is the honest risk with any extension, including this one, and you should
not take our word about it. Every release is tagged in the repository. If you
want to trust nothing at all, load the extension unpacked from source and
nothing can update underneath you.

**Do you see my inventory?**

We see nothing. There is no server to see it with. Your index is in your
browser and never leaves it.

**Will this get my account banned?**

The extension talks to Steam using the same protocol the CS2 client does, which
is how every tool of this kind works, including the ones that have existed for
years. Valve publishes no explicit blessing for third-party clients, so we will
not pretend to have one. What we can tell you is exactly what it does: it logs
in, reads your own items, and logs off.

**Why does it kick me out of CS2?**

An account gets one game session, and reading storage units needs it. Sync when
you are not playing.

---

## How to write about safety here

Rules for anyone editing this file, including future me. The audience is CS2
traders, who are the most scam-aware users on the internet and who punish
salesmanship on sight.

1. **Say "cannot", not "will not", and name what enforces it.** "We don't send
   your data anywhere" is a promise. "The extension has no permission to reach
   any host but Steam's, and Chrome blocks the rest" is a fact the reader can
   check in thirty seconds.
2. **Be specific enough to be falsifiable.** Named hosts, real numbers, a
   linked commit. Adjectives read as marketing; specifics read as true.
3. **Name the residual risk before someone else does.** A safety page with no
   "here is what could still go wrong" section reads as a sales page, and the
   one thing this audience is expert at is spotting a sales page.
4. **Never claim more than the code does.** In particular: the stored sign-in
   token is not encrypted at rest today, so nothing here may imply that it is.
   If that changes, this line changes with it.

Phrases that must never appear: "100% safe", "bank-level security",
"military-grade encryption", "we take your privacy seriously". They are
load-bearing in scam copy, and readers have learned to treat them as warnings.

---

## Permission justifications

The Chrome Web Store asks for a reason for each one. These are the reasons.

| Permission | Why it is needed |
| --- | --- |
| `storage` | Stores your inventory index and your sign-in in this browser profile. |
| `unlimitedStorage` | A large account is around 13 MB of index, past the 10 MB `storage` allows by default. |
| `declarativeNetRequestWithHostAccess` | One rule: remove the `Origin` header from connections to Steam's own game servers, which refuse any connection that carries one. It is scoped to `steamserver.net` and cannot affect any other request. |
| `steamcommunity.com` | Reads your public inventory, which is what the extension shows before you sign in. |
| `api.steampowered.com` | Fetches Steam's public list of connection-manager servers, to know which one to connect to. |
| `*.steamserver.net` | The connection to Steam that carries the sign-in and the inventory read. |
| `raw.githubusercontent.com` | Downloads the public CS2 item schema, which is what turns a numeric item id into "AK-47 \| Redline". |
| `prices.csgotrader.app` (optional) | Item prices, for the value column and portfolio. Optional: it is requested only when the user presses "Prices", and the extension is fully functional without it. |

**Single purpose:** indexing and searching the CS2 inventory of the signed-in
user, including the contents of storage units.

**Remote code:** none. Everything executable ships in the package. The item
schema fetched from GitHub is JSON data and is never executed.

---

## Privacy policy

Also needs to be hosted at a public URL for the submission. This text is the
whole of it.

> **CS2 Inventory — Privacy Policy**
>
> This extension does not collect, transmit, or sell any personal information.
>
> There is no server operated by this extension's developer. No data of any
> kind is sent to the developer or to any third party.
>
> **What is stored, and where.** The extension stores two things in your
> browser's local extension storage, on your own device:
>
> 1. An index of your CS2 inventory — item names, which storage unit each item
>    is in, and when each was first and last seen.
> 2. A Steam sign-in token, obtained when you scan the QR code.
>
> Neither leaves your device. Both are removed when you uninstall the
> extension, and the sign-in can be deleted at any time with the "Forget this
> sign-in" button.
>
> **What the extension connects to.** Valve's servers (`steamcommunity.com`,
> `api.steampowered.com`, `*.steamserver.net`), to read your inventory and sign
> you in; and `raw.githubusercontent.com`, to download the public CS2 item
> schema used to name items. No request carries anything about you beyond what
> Steam already requires to answer it.
>
> If — and only if — you press "Prices", the extension asks your permission to
> also fetch a public price list from `prices.csgotrader.app`. That request
> downloads a file of item prices and sends nothing about you or your
> inventory. Decline it, or never press the button, and the extension never
> contacts that host.
>
> **Your Steam credentials.** The extension never receives your Steam password
> or your Steam Guard code. Signing in happens by QR code, approved in the
> Steam mobile app. The resulting sign-in appears in your Steam device list and
> can be revoked there at any time.
>
> **Contact:** <a GitHub issue on the repository above>.

---

## Before submitting

- [ ] Host the privacy policy at a public URL and put that URL in the listing.
- [ ] Screenshots: 1280×800 or 640×400. Worth showing the search across units,
      the unit sidebar with a count, and the QR sign-in.
- [ ] A short video of revoking: sign in, sync, then Steam → Authorized devices
      → revoke, and the extension losing access. Nobody who watches that still
      believes they handed something over, and it costs one screen recording.
      It is worth more than every paragraph above it.
- [ ] Install the packed zip in a clean Chrome profile and read the permission
      prompt as a new user would.
- [ ] Decide what the listing says about third-party tools and Steam. The
      extension uses the same protocol the official client does, which is how
      every tool of this kind works, but Valve publishes no explicit blessing
      for it and the account risk, whatever it is, falls on the user rather
      than on you.
