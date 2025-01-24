import { openTab } from "../tabs/api.js";
import { getActiveFolder } from "../tabs/lib.js";
import {
  createBookmark,
  deleteBookmark,
  editBookmark,
  updateGroup,
} from "./api.js";
import { getBookmarkContainer, renderFolder } from "./ui.js";

export const onClickBookmark = (event) => {
  const url = event.currentTarget.dataset.url;
  const groupTitle = event.currentTarget.dataset.group;
  const openInCurrentTab = !event.ctrlKey;

  openTab(url, groupTitle, openInCurrentTab);
};

export const onEditBookmark = async (event) => {
  event.stopPropagation();
  const bookmarkId = event.currentTarget.parentNode.id;

  const editDialog = document.getElementById("dialog");
  const editForm = document.getElementById("edit-bookmark");

  let { title, url } = (await chrome.bookmarks.get(bookmarkId))[0];

  const [titleInput, urlInput] = editForm.getElementsByTagName("input");
  urlInput.value = url;
  titleInput.value = title;

  const deleteButton = document.getElementById("delete-bookmark");
  deleteButton.classList.remove("bookmark-form__delete-btn_hidden");

  editDialog.showModal();

  const resetButton = editForm.querySelector('button[type="reset"]');
  resetButton.onclick = () => {
    editDialog.close();
  };

  editForm.onsubmit = async (event) => {
    event.preventDefault();

    const bookmarkContainer = getBookmarkContainer();

    const bookmarkItem = bookmarkContainer.querySelector(
      `li[id="${bookmarkId}"]`
    );

    const title = titleInput.value;
    const url = urlInput.value;
    await editBookmark(bookmarkId, title, url);

    bookmarkItem.setAttribute("data-url", url);
    bookmarkItem.getElementsByTagName("span")[0].textContent = title;
    deleteButton.classList.add("bookmark-form__delete-btn_hidden");
    editDialog.close();
  };

  deleteButton.onclick = async () => {
    await deleteBookmark(bookmarkId);

    const bookmarkContainer = getBookmarkContainer();
    const deletedElement = bookmarkContainer.querySelector(`[id='${bookmarkId}']`);
    deletedElement.remove();
    editDialog.close();
  };
};

export const onCreateBookmark = async (event) => {
  event.stopPropagation();
  const folderId = event.currentTarget.parentNode.id;

  const editDialog = document.getElementById("dialog");
  const editForm = document.getElementById("edit-bookmark");

  editDialog.showModal();

  const resetButton = editForm.querySelector('button[type="reset"]');
  resetButton.onclick = () => {
    editDialog.close();
  };

  editForm.onsubmit = async (event) => {
    event.preventDefault();
    const [titleInput, urlInput] = editForm.getElementsByTagName("input");

    const title = titleInput.value;
    const url = urlInput.value;

    try {
      await createBookmark(title, url, folderId);

      // Really lazy :9
      const selectedTab = getActiveFolder();
      renderFolder(selectedTab.id);
      editDialog.close();
    } catch (e) {
      alert(e);
    }
  };
};

let dragElementId;

export const onDragStartBookmark = (event) => {
  event.target.classList.add("card__item_droppable");
  dragElementId = event.target.id;
};

export const onDragEnterBookmark = (event) => {
  if (event.currentTarget.id === dragElementId) return;

  const dragElement = document.getElementById(dragElementId);
  const parentNode = event.currentTarget.parentNode;

  for (let i = 0; i < parentNode.children.length; i++) {
    if (event.currentTarget.parentNode.children[i].id === dragElementId) {
      parentNode.insertBefore(dragElement, event.currentTarget.nextSibling);
      break;
    } else if (parentNode.children[i].id === event.currentTarget.id) {
      parentNode.insertBefore(dragElement, event.currentTarget);
      break;
    }
  }
};

export const onDragEndBookmark = async (event) => {
  event.target.classList.remove("card__item_droppable");

  const parentFolder = event.target.parentNode;

  const folders = await chrome.bookmarks.getChildren(parentFolder.id);

  const folderIndexes = folders.filter((f) => !f.url).map((f) => f.index);

  const bookmark = (await chrome.bookmarks.get(event.target.id))[0];
  let newIndex = Array.prototype.indexOf.call(
    parentFolder.children,
    event.target
  );
  const parentId = event.target.parentNode.id;

  // Stypid workaround https://stackoverflow.com/a/26788201
  if (bookmark.index < newIndex) newIndex++;

  // Ignore folders indexes
  folderIndexes.forEach((f) => f > newIndex && newIndex++);

  await chrome.bookmarks.move(bookmark.id, {
    parentId,
    index: newIndex,
  });
};

export const onEditGroup = (event) => {
  const targetGroup = event.currentTarget;
  const id = targetGroup.id;

  const folderInput = document.createElement("input");
  folderInput.value = targetGroup.innerText;
  folderInput.defaultValue = targetGroup.innerText;
  folderInput.id = id;

  targetGroup.innerHTML = "";

  targetGroup.prepend(folderInput);
  folderInput.focus();

  targetGroup.ondblclick = "";

  targetGroup.addEventListener("keydown", onSaveGroup);
  targetGroup.addEventListener("focusout", onResetGroup);
};

const onSaveGroup = async (event) => {
  const { key } = event;
  if (key === "Enter") {
    const targetGroup = event.currentTarget;
    const id = targetGroup.id;
    const name = targetGroup.firstElementChild.value;

    if (name === "") {
      onResetGroup({ currentTarget: targetGroup });
      return;
    }

    try {
      await updateGroup(id, name);

      targetGroup.innerText = name;
      targetGroup.ondblclick = onEditGroup;

      targetGroup.removeEventListener("keydown", onSaveGroup);
      targetGroup.removeEventListener("focusout", onResetGroup);
    } catch (e) {
      alert("Something went wrong. Can't update folder name");
      console.error(e);
    }
  }

  if (key === "Escape") {
    onResetGroup(event);
  }
};

export const onResetGroup = (event) => {
  const targetFolder = event.currentTarget;
  const name = targetFolder.children[0].defaultValue;

  targetFolder.innerText = name;
  targetFolder.ondblclick = onEditGroup;

  targetFolder.removeEventListener("keydown", onSaveGroup);
  targetFolder.removeEventListener("focusout", onResetGroup);
};
