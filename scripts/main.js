import { getBookmarksTree } from "./bookmarks/api.js";
import {
  getFolderOrder,
  getLastSelectedFolder,
  getUngroupedFolderName,
  setFolderOrder,
} from "./store/api.js";
import { attachCreateFolder } from "./tabs/lib.js";
import { getNav, createNavItem } from "./tabs/ui.js";

const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.querySelector(":root");
if (isDarkTheme) root.className = "dark";

const onInit = async () => {
  try {
    const bookmarksTree = await getBookmarksTree();
    const folderOrder = await getFolderOrder();

    const navigation = getNav();

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
        title: await getUngroupedFolderName(),
        id: "-1",
      });
    }

    if (folderOrder) {
      folders.sort(
        (a, b) => folderOrder.indexOf(b.id) - folderOrder.indexOf(a.id)
      );
    } else {
      setFolderOrder(folders.map((folder) => folder.id));
    }

    folders.forEach((folder) => {
      const navItem = createNavItem(folder.id, folder.title);
      navigation.prepend(navItem);
    });

    const lastSelectedId = await getLastSelectedFolder();

    if (lastSelectedId) {
      const lastSelectedEl = navigation.querySelector(
        `li[id="${lastSelectedId}"]`
      );
      if (lastSelectedEl) lastSelectedEl.click();
      else navigation.firstElementChild.click();
    } else {
      navigation.firstElementChild.click();
    }
  } catch (error) {
    console.error(`Error initializing: ${error}`);
  }

  attachCreateFolder();
};

onInit();

document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    const navigation = getNav();
    const createFolderBtn = document.getElementById("add-folder");
    navigation.innerHTML = "";
    navigation.prepend(createFolderBtn);
    onInit();
  }
});
