/**
 * The only job here is to open the app in a tab when the toolbar icon is
 * clicked. Everything that matters -- the Steam connection included -- happens
 * in that page, because the Origin-stripping rule is only proven to apply to
 * sockets opened from a page, and because a sync that takes minutes has no
 * business in a worker Chrome may evict.
 *
 * It deliberately does not look for an already-open tab: finding one means
 * querying tabs by URL, which needs the `tabs` permission, and "read your
 * browsing history" is not a reasonable thing to ask for in exchange for
 * avoiding a duplicate tab.
 */
chrome.action.onClicked.addListener(() => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
});
