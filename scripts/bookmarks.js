const editFolderTitle = async (id, title) => {
  const folder = await chrome.bookmarks.get(id);
  await chrome.bookmarks.update(id, { title });

  const groups = await chrome.tabGroups.query({});
  const group = groups.find((g) => g.title === folder[0].title);

  if (group) {
    await chrome.tabGroups.update(group.id, { title });
  }
};

const editBookmark = (id, title, url) =>
  chrome.bookmarks.update(id, { title, url });

const openBookmark = async (event) => {
  const url = event.currentTarget.dataset.url;
  const groupTitle = event.currentTarget.dataset.group;
  const tab = await chrome.tabs.create({
    url,
    active: !event.ctrlKey,
  });

  const groups = await chrome.tabGroups.query({});
  const group = groups.find((g) => g.title === groupTitle);

  if (group) {
    await chrome.tabs.group({
      tabIds: [tab.id],
      groupId: group.id,
    });
  } else {
    const groupId = await chrome.tabs.group({
      tabIds: [tab.id],
    });

    await chrome.tabGroups.update(groupId, {
      title: groupTitle,
    });
  }

  const newTab = await chrome.tabs.getCurrent();
  if (!event.ctrlKey) await chrome.tabs.remove(newTab.id);
};

const renderFolder = async (id) => {
  const bookmarks = (await chrome.bookmarks.getSubTree(id))[0];
  renderBookmarks({ children: bookmarks.children }, bookmarks.title);
};

const renderUngroupedFolder = () =>
  chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
    const bookmarksTree = bookmarkTreeNodes[0].children;

    const bookmarks = [];
    for (let i = 0; i < bookmarksTree.length; i++) {
      const topLevelFolder = bookmarksTree[i];

      for (let j = 0; j < topLevelFolder.children.length; j++) {
        const bookmark = topLevelFolder.children[j];
        if (!bookmark.children) {
          bookmarks.push(bookmark);
        }
      }
    }
    await initStorageCache;
    const groupTitle = storageCache.ungroupedFolderName ?? "Ungrouped";
    renderBookmarks({ children: bookmarks }, groupTitle);
  });

const renderBookmarks = (bookmarks, groupTitle) => {
  const content = document.getElementById("bookmarks");

  content.innerHTML = "";

  renderBookmarksCards(bookmarks, groupTitle, content);
};

const renderBookmarksCards = (bookmarks, groupTitle, parentNode) => {
  const card = document.createElement("article");
  card.className = "card";
  const content = document.createElement("ul");
  content.className = "card__content";

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

      content.prepend(item);
    }
  }

  if (bookmarks.title) {
    const title = document.createElement("h2");
    title.className = "card__title";
    title.innerText = bookmarks.title;
    title.setAttribute("data-id", bookmarks.id);
    title.ondblclick = onEditFolderName;
    card.prepend(title);
  }

  card.append(content);

  if (content.innerHTML !== "") parentNode.prepend(card);
};

const createLinkItem = (id, title, url, group) => {
  const item = document.createElement("li");
  item.className = "card__item";
  item.setAttribute("data-id", id);
  item.setAttribute("data-url", url);
  item.setAttribute("data-group", group);
  item.tabIndex = 0;
  item.onclick = openBookmark;
  item.onkeydown = (event) => {
    if (event.key === "Enter") openBookmark(event);
  };

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

  item.prepend(edit);
  item.prepend(text);
  item.prepend(img);

  return item;
};

const getFaviconUrl = (u) => {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "16");
  return url.toString();
};
