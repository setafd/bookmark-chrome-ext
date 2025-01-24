document.addEventListener("DOMContentLoaded", () => {
  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const bookmarkDashboard = document.getElementById("bookmark-dashboard");

    const bookmarksGroups = bookmarkTreeNodes[0].children[1].children;

    for (let i = 0; i < bookmarksGroups.length; i++) {
      const { title: groupTitle, children: bookmarks } = bookmarksGroups[i];

      const groupCard = createCard(groupTitle, bookmarks);

      bookmarkDashboard.prepend(groupCard);
    }

    const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");

    var r = document.querySelector(":root");
    if (isDarkTheme) r.className = "dark";
  });
});

const createCard = (groupTitle, bookmarks, parentTitle = groupTitle) => {
  const groupCard = createCardEl();
  bookmarks.sort((a, b) => {
    if ((a.url && b.url) || (!a.url && !b.url)) return 0;
    if (a.url && !b.url) return -1;
    return 1;
  });

  const groupTitleElement = craeteCardTitleEl();
  groupTitleElement.prepend(groupTitle);

  groupCard.append(groupTitleElement);

  const content = createCardContentEl();

  for (let j = 0; j < bookmarks.length; j++) {
    const { title, url, children } = bookmarks[j];

    if (children !== undefined) {
      const secondLevelGroup = createCard(
        title,
        children,
        parentTitle ?? groupTitle
      );

      content.append(secondLevelGroup);
      continue;
    }

    const bookmarkItem = createCardItem(title, url);
    bookmarkItem.onclick = async () => {
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
          title: parentTitle ?? groupTitle,
        });
      }

      const newTab = await chrome.tabs.getCurrent();
      await chrome.tabs.remove(newTab.id);
    };

    content.append(bookmarkItem);
  }

  groupCard.append(content);

  return groupCard;
};

const createCardItem = (title, url) => {
  const favIconUrl = getFaviconUrl(url);
  const icon = document.createElement("img");
  icon.src = favIconUrl;

  const bookmarkLink = document.createElement("span");
  bookmarkLink.className = "item__link";
  bookmarkLink.prepend(title);
  bookmarkLink.prepend(icon);

  const bookmarkItem = createCardContentItemEl();
  bookmarkItem.append(bookmarkLink);

  return bookmarkItem;
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
