import { getBookmarksTree } from "../bookmarks/api.js";

export const updateTabGroup = async (oldTitle, newTitle) => {
  try {
    const groups = await chrome.tabGroups.query({});
    const group = groups.find((g) => g.title === oldTitle);

    if (group) {
      await chrome.tabGroups.update(group.id, { title: newTitle });
    }
  } catch {
    console.error(`Error updating group title: ${error}`);
  }
};

export const openTab = async (url, groupTitle, inCurrent) => {
  try {
    let tab = await chrome.tabs.getCurrent();
    if (inCurrent) {
      window.open(url, "_self");
    } else {
      tab = await chrome.tabs.create({ url, active: false });
    }

    const group = (await chrome.tabGroups.query({ title: groupTitle }))?.[0];

    if (group) {
      await chrome.tabs.group({ tabIds: [tab.id], groupId: group.id });
    } else {
      const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
      await chrome.tabGroups.update(groupId, { title: groupTitle });
    }
  } catch (error) {
    console.error(`Error opening tab: ${error}`);
  }
};

export const createFolder = async (title) => {
  const bookmarkTree = await getBookmarksTree();

  const parent = bookmarkTree.pop();

  return await chrome.bookmarks.create({ title, parentId: parent.id });
};

export const updateFolder = async (id, title) => {
  try {
    const folder = await chrome.bookmarks.get(id);
    await chrome.bookmarks.update(id, { title });

    updateTabGroup(folder[0].title, title);

    return folder;
  } catch (error) {
    console.error(`Error editing folder title: ${error}`);
  }
};
