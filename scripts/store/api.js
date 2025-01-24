const storageCache = {};
const initStorageCache = chrome.storage.sync.get().then((items) => {
  Object.assign(storageCache, items);
});

const sessionCache = {};
const initSessionCache = chrome.storage.session.get().then((items) => {
  Object.assign(sessionCache, items);
});

export const getFolderOrder = async () => {
  await initStorageCache;
  return storageCache.order;
};

export const setFolderOrder = async (ids) => {
  return chrome.storage.sync.set({ order: ids });
};

export const getUngroupedFolderName = async () => {
  await initStorageCache;
  return storageCache.ungroupedFolderName ?? "Ungrouped"
};

export const setUngroupedFolderName = async (name) => {
  return chrome.storage.sync.set({ ungroupedFolderName: name });
};

export const getLastSelectedFolder = async () => {
  await initSessionCache;
  return sessionCache.last;
};

export const setLastSelecftedFolder = async (id) => {
  return chrome.storage.session.set({ last: id });
}
