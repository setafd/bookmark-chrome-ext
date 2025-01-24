import { getFaviconUrl } from "../shared/lib.js";
import { getUngroupedFolderName } from "../store/api.js";
import {
  onClickBookmark,
  onCreateBookmark,
  onDragEndBookmark,
  onDragEnterBookmark,
  onDragStartBookmark,
  onEditBookmark,
  onEditGroup,
} from "./lib.js";

export const renderFolder = async (id) => {
  if (id !== "-1") {
    renderFolderById(id);
  } else {
    renderUngroupedFolder();
  }
};

const renderFolderById = async (id) => {
  try {
    const bookmarks = (await chrome.bookmarks.getSubTree(id))[0];
    renderBookmarks(
      { children: bookmarks.children, id: bookmarks.id },
      bookmarks.title
    );
  } catch (error) {
    console.error(`Error rendering folder: ${error}`);
  }
};

const renderUngroupedFolder = async () => {
  try {
    const bookmarksTree = (await chrome.bookmarks.getTree())[0].children;
    const bookmarks = bookmarksTree.flatMap((folder) =>
      folder.children.filter((bookmark) => !bookmark.children)
    );

    await initStorageCache;
    const groupTitle = await getUngroupedFolderName();
    renderBookmarks({ children: bookmarks, id: "-1" }, groupTitle);
  } catch (error) {
    console.error(`Error rendering ungrouped folder: ${error}`);
  }
};

export const getBookmarkContainer = () => document.getElementById("bookmarks");

const renderBookmarks = (bookmarks, groupTitle) => {
  const content = getBookmarkContainer();

  content.innerHTML = "";

  renderBookmarksCards(bookmarks, groupTitle, content);
  new Isotope(content, {
    itemSelector: ".card",
    layoutMode: "packery",
    packery: {
      gutter: 16,
    },
  });
};

const renderBookmarksCards = (bookmarks, groupTitle, parentNode) => {
  const card = document.createElement("article");
  card.className = "card";
  const content = document.createElement("ul");
  content.className = "card__content";
  content.id = bookmarks.id;

  for (let i = 0; i < bookmarks.children.length; i++) {
    const bookmark = bookmarks.children[i];

    if (bookmark.children) {
      renderBookmarksCards(bookmark, groupTitle, parentNode);
    } else {
      const item = createLinkItem(
        bookmark.id,
        bookmark.title,
        bookmark.url,
        groupTitle
      );

      content.append(item);
    }
  }

  if (bookmarks.title) {
    const title = document.createElement("h2");
    title.className = "card__title";
    title.innerText = bookmarks.title;
    title.id = bookmarks.id;
    title.ondblclick = onEditGroup;
    card.prepend(title);
  }

  card.append(content);

  if (content.innerHTML !== "") {
    parentNode.prepend(card);
    addCreateBookmarkButton(content);
  }
};

const addCreateBookmarkButton = (content) => {
  const createItem = document.createElement("li");
  createItem.className = "card__item";
  createItem.onclick = onCreateBookmark;

  const createIcon = document.createElement("img");
  createIcon.src = chrome.runtime.getURL("assets/plus.svg");
  createIcon.className = "card__item-create-btn";
  createItem.append(createIcon);

  const text = document.createElement("span");
  text.className = "card__item-text";
  text.innerText = "Add Bookmark";

  createItem.append(text);
  content.append(createItem);
};

const createLinkItem = (id, title, url, group) => {
  const item = document.createElement("li");
  item.className = "card__item";
  item.setAttribute("data-url", url);
  item.setAttribute("data-group", group);
  item.tabIndex = 0;
  item.onclick = onClickBookmark;
  item.onkeydown = (event) => {
    if (event.key === "Enter") onClickBookmark(event);
  };
  item.id = id;
  item.draggable = "true";
  item.ondragstart = onDragStartBookmark;
  item.ondragend = onDragEndBookmark;
  item.ondragenter = onDragEnterBookmark;

  const faviconUrl = getFaviconUrl(url);
  const img = document.createElement("img");
  img.src = faviconUrl;

  const text = document.createElement("span");
  text.className = "card__item-text";
  text.innerText = title;

  const edit = document.createElement("img");
  edit.src = chrome.runtime.getURL("assets/edit.svg");
  edit.className = "card__item-edit-btn";
  edit.onclick = onEditBookmark;

  item.prepend(img, text, edit);

  return item;
};
