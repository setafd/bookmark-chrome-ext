const onInit = () => {
  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const bookmarkDashboard = document.getElementById("bookmarks");

    const bookmarksGroups = bookmarkTreeNodes[0].children[1].children;

    for (let i = 0; i < bookmarksGroups.length; i++) {
      const { title: groupTitle, children: bookmarks } = bookmarksGroups[i];

      const groupCard = createCard(groupTitle, bookmarks);

      bookmarkDashboard.prepend(groupCard);
    }

    const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");

    var root = document.querySelector(":root");
    if (isDarkTheme) root.className = "dark";
  });
};

const createCard = (groupTitle, bookmarks, parentTitle = groupTitle) => {
  const groupCard = createCardEl();
  bookmarks.sort((a, b) => {
    if (!a.url && b.url) return 1;
    if (a.url && !b.url) return -1;
    return 0;
  });

  const groupTitleElement = craeteCardTitleEl();
  groupTitleElement.prepend(groupTitle);

  groupCard.append(groupTitleElement);

  const content = createCardContentEl();

  for (let j = 0; j < bookmarks.length; j++) {
    const { title, url, children, id } = bookmarks[j];

    if (children !== undefined) {
      const secondLevelGroup = createCard(title, children, parentTitle);

      content.append(secondLevelGroup);
      continue;
    }

    const bookmarkItem = createCardItem(id, title, url, parentTitle);

    content.append(bookmarkItem);
  }

  groupCard.append(content);

  return groupCard;
};

const createCardItem = (bookmarkId, title, url, parentTitle) => {
  const favIconUrl = getFaviconUrl(url);
  const favicon = document.createElement("img");
  favicon.src = favIconUrl;

  const bookmarkLink = document.createElement("span");
  bookmarkLink.className = "item__text";
  bookmarkLink.prepend(title);

  const bookmarkItem = createCardContentItemEl();
  bookmarkItem.append(bookmarkLink);
  bookmarkItem.prepend(favicon);

  bookmarkItem.setAttribute("data-url", url);
  bookmarkItem.setAttribute("data-title", parentTitle);
  bookmarkItem.onclick = onOpenLink;

  const editBtn = createEditButton(bookmarkId);
  bookmarkItem.append(editBtn);

  return bookmarkItem;
};

const createEditButton = (bookmark) => {
  const editBtn = document.createElement("button");
  editBtn.append("<>");
  editBtn.className = "item__edit-button";
  editBtn.setAttribute("data-bookmark", bookmark);
  editBtn.onclick = onOpenEditDialog;

  return editBtn;
};

const onOpenEditDialog = async (ev) => {
  ev.stopPropagation();
  const bookmarkId = ev.currentTarget.getAttribute("data-bookmark");

  const editDialog = document.getElementById("dialog");

  let { title, url } = (await chrome.bookmarks.get(bookmarkId))[0];

  const editForm = document.getElementById("edit-bookmark");

  const [titleInput, urlInput] = editForm.getElementsByTagName("input");
  urlInput.value = url;
  titleInput.value = title;

  editDialog.showModal();

  editForm.querySelector('button[type="reset"]').onclick = () => {
    editDialog.close();
  };

  editForm.onsubmit = async (event) => {
    event.preventDefault();

    const bookmarkItem = document.querySelector(`li[data-url="${url}"]`);

    title = titleInput.value;
    url = urlInput.value;
    await chrome.bookmarks.update(bookmarkId, { title, url });

    bookmarkItem.setAttribute("data-url", url);
    bookmarkItem.getElementsByTagName("span")[0].textContent = title;
    editDialog.close();
  };
};

const onOpenLink = async (ev) => {
  const url = ev.currentTarget.getAttribute("data-url");
  const parentTitle = ev.currentTarget.getAttribute("data-title");
  const tab = await chrome.tabs.create({
    url: url,
  });

  const groups = await chrome.tabGroups.query({});
  const group = groups.find((g) => g.title === parentTitle);

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
      title: parentTitle,
    });
  }

  const newTab = await chrome.tabs.getCurrent();
  await chrome.tabs.remove(newTab.id);
};

const createCardEl = () => {
  const card = document.createElement("section");
  card.className = "card";

  return card;
};

const craeteCardTitleEl = () => {
  const title = document.createElement("h1");
  title.className = "card__title";

  return title;
};

const createCardContentEl = () => {
  const content = document.createElement("ul");
  content.className = "card__content";

  return content;
};

const createCardContentItemEl = () => {
  const item = document.createElement("li");
  item.className = "card__item";

  return item;
};

const getFaviconUrl = (u) => {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "16");
  return url.toString();
};

document.addEventListener("DOMContentLoaded", onInit);
