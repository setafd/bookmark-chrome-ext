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

    await initStorageCache;
    const folderOrder = storageCache.order;

    const navigator = createNavContainer();

    let hasUnfolderedLinks = false;
    let folders = [];
    for (let i = 0; i < bookmarksTree.length; i++) {
      const topLevelFolder = bookmarksTree[i];

      for (let j = 0; j < topLevelFolder.children.length; j++) {
        const bookmark = topLevelFolder.children[j];
        if (bookmark.children) {
          folders.push(bookmark);
        } else {
          hasUnfolderedLinks = true;
        }
      }
    }

    if (hasUnfolderedLinks) {
      folders.push({
        title: storageCache.ungroupedFolderName ?? "Ungrouped",
        id: "-1",
      });
    }

    if (folderOrder) {
      folders.sort(
        (a, b) => folderOrder.indexOf(a.id) - folderOrder.indexOf(b.id)
      );
    }

    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      pushToNavigation(navigator, folder.title, folder.id);
    }

    await initSessionCache;
    const lastSelectedId = sessionCache.last ?? null;

    if (lastSelectedId) {
      const lastSelectedEl = navigator.querySelector(
        `li[id="${lastSelectedId}"]`
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
  item.id = id;
  item.draggable = "true";
  item.ondragstart = onDragStartHeaderItem;
  item.ondragend = onDragEndHeaderItem;
  item.ondragenter = onDragEnterHeaderItem;

  nav.append(item);

  return item;
};

document.addEventListener("DOMContentLoaded", onInit);
