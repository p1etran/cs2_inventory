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
- Works offline once indexed. Open it on a plane and your inventory is there.

**How you sign in**

You scan a QR code in the Steam mobile app, the same way you sign in to Steam
itself. This extension never sees your password and never sees a Steam Guard
code. The sign-in shows up in your Steam device list as
"CS2 Inventory (browser extension)" so you can recognise it and revoke it
whenever you like.

You do not scan on every visit. The sign-in lasts months, and searching your
index needs no sign-in at all. Before you sign in the first time, it already
shows your public inventory and your units' item counts.

**Where your data goes**

Nowhere. There is no server, no account, and no analytics. Your inventory index
and your Steam sign-in are stored in this browser profile and are never
transmitted anywhere except to Steam itself. Removing the extension removes
them with it.

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
> **What the extension connects to.** Only Valve's servers
> (`steamcommunity.com`, `api.steampowered.com`, `*.steamserver.net`), to read
> your inventory and sign you in; and `raw.githubusercontent.com`, to download
> the public CS2 item schema used to name items. No request carries anything
> about you beyond what Steam already requires to answer it.
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
- [ ] Install the packed zip in a clean Chrome profile and read the permission
      prompt as a new user would.
- [ ] Decide what the listing says about third-party tools and Steam. The
      extension uses the same protocol the official client does, which is how
      every tool of this kind works, but Valve publishes no explicit blessing
      for it and the account risk, whatever it is, falls on the user rather
      than on you.
