const editFolderTitle = async (id, title) => {
  try {
    const folder = await chrome.bookmarks.get(id);
    await chrome.bookmarks.update(id, { title });

    const groups = await chrome.tabGroups.query({});
    const group = groups.find((g) => g.title === folder[0].title);

    if (group) {
      await chrome.tabGroups.update(group.id, { title });
    }
  } catch (error) {
    console.error(`Error editing folder title: ${error}`);
  }
};

const editBookmark = (id, title, url) =>
  chrome.bookmarks.update(id, { title, url });

const createBookmark = (title, url, parentId) =>
  chrome.bookmarks.create({ title, url, parentId });

const deleteBookmark = (id) => chrome.bookmarks.remove(id);

const openBookmark = async (event) => {
  try {
    const url = event.currentTarget.dataset.url;
    const groupTitle = event.currentTarget.dataset.group;
    const openInCurrentTab = !event.ctrlKey;

    let tab = await chrome.tabs.getCurrent();
    if (openInCurrentTab) {
      window.open(url, "_self");
    } else {
      tab = await chrome.tabs.create({ url, active: false });
    }

    const groups = await chrome.tabGroups.query({});
    const group = groups.find((g) => g.title === groupTitle);

    if (group) {
      await chrome.tabs.group({ tabIds: [tab.id], groupId: group.id });
    } else {
      const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
      await chrome.tabGroups.update(groupId, { title: groupTitle });
    }
  } catch (error) {
    console.error(`Error opening bookmark: ${error}`);
  }
};

const renderFolder = async (id) => {
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
    const groupTitle = storageCache.ungroupedFolderName ?? "Ungrouped";
    renderBookmarks({ children: bookmarks }, groupTitle);
  } catch (error) {
    console.error(`Error rendering ungrouped folder: ${error}`);
  }
};

const renderBookmarks = (bookmarks, groupTitle) => {
  const content = document.getElementById("bookmarks");

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
    title.ondblclick = onEditFolderName;
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
  item.onclick = openBookmark;
  item.onkeydown = (event) => {
    if (event.key === "Enter") openBookmark(event);
  };
  item.id = id;
  item.draggable = "true";
  item.ondragstart = onDragStartFolderItem;
  item.ondragend = onDragEndFolderItem;
  item.ondragenter = onDragEnterFolderItem;

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

const getFaviconUrl = (u) => {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "16");
  return url.toString();
};
