const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");

const root = document.querySelector(":root");
if (isDarkTheme) root.className = "dark";

const storageCache = {};
const initStorageCache = chrome.storage.sync.get().then((items) => {
  Object.assign(storageCache, items);
});

const sessionCache = {};
const initSessionCache = chrome.storage.session.get().then((items) => {
  Object.assign(sessionCache, items);
});

const onInit = () => {
  chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
    const bookmarksTree = bookmarkTreeNodes[0].children;

    const navigator = createNavContainer();

    let hasUnfolderedLinks = false;
    for (let i = 0; i < bookmarksTree.length; i++) {
      const topLevelFolder = bookmarksTree[i];

      for (let j = 0; j < topLevelFolder.children.length; j++) {
        const bookmark = topLevelFolder.children[j];
        if (bookmark.children) {
          pushToNavigation(navigator, bookmark.title, bookmark.id);
        } else {
          hasUnfolderedLinks = true;
        }
      }
    }

    if (hasUnfolderedLinks) {
      await initStorageCache;
      pushToNavigation(
        navigator,
        storageCache.ungroupedFolderName ?? "Ungrouped",
        "-1"
      );
    }

    await initSessionCache;
    const lastSelectedId = sessionCache.last ?? null;

    if (lastSelectedId) {
      const lastSelectedEl = navigator.querySelector(
        `li[data-id="${lastSelectedId}"]`
      );
      if (lastSelectedEl) lastSelectedEl.click();
      else navigator.children[0].click();
    } else {
      navigator.children[0].click();
    }
  });
};

const createNavContainer = () => {
  const navigator = document.getElementById("nav");
  const list = document.createElement("ul");
  list.className = "navigation__wrapper";
  navigator.prepend(list);

  return list;
};

const pushToNavigation = (nav, title, id) => {
  const item = document.createElement("li");
  item.className = "navigation__item";
  item.tabIndex = 0;
  item.prepend(title);

  item.ondblclick = onEditFolderName;
  item.onclick = onChangeFolder;
  item.onkeydown = (event) => {
    if (event.key === "Enter") onChangeFolder(event);
  };
  item.setAttribute("data-id", id);

  nav.prepend(item);

  return item;
};

document.addEventListener("DOMContentLoaded", onInit);
