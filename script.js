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
    const { title, url, children } = bookmarks[j];

    if (children !== undefined) {
      const secondLevelGroup = createCard(title, children, parentTitle);

      content.append(secondLevelGroup);
      continue;
    }

    const bookmarkItem = createCardItem(title, url, parentTitle);

    content.append(bookmarkItem);
  }

  groupCard.append(content);

  return groupCard;
};

const createCardItem = (title, url, parentTitle) => {
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

  return bookmarkItem;
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
