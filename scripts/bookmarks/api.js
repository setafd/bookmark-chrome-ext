export const getBookmarksTree = async () => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((nodes) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(nodes[0].children);
      }
    });
  });
};
export const editBookmark = (id, title, url) =>
  chrome.bookmarks.update(id, { title, url });

export const createBookmark = (title, url, parentId) =>
  chrome.bookmarks.create({ title, url, parentId });

export const deleteBookmark = (id) => chrome.bookmarks.remove(id);

export const updateGroup = async (id, title) => {
  try {
    const folder = await chrome.bookmarks.get(id);
    await chrome.bookmarks.update(id, { title });

    return folder;
  } catch (error) {
    console.error(`Error editing group title: ${error}`);
  }
};
