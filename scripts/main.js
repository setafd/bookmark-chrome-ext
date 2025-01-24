import { getBookmarksTree } from "./bookmarks/api.js";
import { getFolderOrder, getLastSelectedFolder, getUngroupedFolderName } from "./store/api.js";
import { createNavContainer, createNavItem } from "./tabs/ui.js";

const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.querySelector(":root");
if (isDarkTheme) root.className = "dark";

const onInit = async () => {
  try {
    const bookmarkTreeNodes = await getBookmarksTree();

    const bookmarksTree = bookmarkTreeNodes[0].children;
    const folderOrder = await getFolderOrder();

    const navigator = createNavContainer();

    let hasUnfolderedLinks = false;
    let folders = [];
    bookmarksTree.forEach((topLevelFolder) => {
      topLevelFolder.children.forEach((bookmark) => {
        if (bookmark.children) {
          folders.push(bookmark);
        } else {
          hasUnfolderedLinks = true;
        }
      });
    });

    if (hasUnfolderedLinks) {
      folders.push({
        title: getUngroupedFolderName(),
        id: "-1",
      });
    }

    if (folderOrder) {
      folders.sort(
        (a, b) => folderOrder.indexOf(a.id) - folderOrder.indexOf(b.id)
      );
    }

    folders.forEach((folder) => {
      const navItem = createNavItem(folder.id, folder.title);
      navigator.append(navItem);
    });

    const lastSelectedId = await getLastSelectedFolder();

    if (lastSelectedId) {
      const lastSelectedEl = navigator.querySelector(
        `li[id="${lastSelectedId}"]`
      );
      if (lastSelectedEl) lastSelectedEl.click();
      else navigator.firstElementChild.click();
    } else {
      navigator.firstElementChild.click();
    }
  } catch (error) {
    console.error(`Error initializing: ${error}`);
  }
};

onInit();
