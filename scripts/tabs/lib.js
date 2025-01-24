import { renderFolder } from "../bookmarks/ui.js";
import {
  getFolderOrder,
  setFolderOrder,
  setLastSelecftedFolder,
  setUngroupedFolderName,
} from "../store/api.js";
import { createFolder, deleteFolder, updateFolder } from "./api.js";
import { createNavItem } from "./ui.js";

export const attachCreateFolder = () => {
  const createFolderButton = document.getElementById("add-folder");
  createFolderButton.onclick = onCreateFolder;
  createFolderButton.onkeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCreateFolder(event);
    }
  };
};

export const getActiveFolder = () => {
  return document.querySelector(".navigation__item_selected");
};

export const onChangeFolder = (event) => {
  const selectedEl = getActiveFolder();
  if (selectedEl === event.currentTarget) return;

  selectedEl?.classList.remove("navigation__item_selected");
  event.currentTarget.classList.add("navigation__item_selected");

  const id = event.currentTarget.id;
  renderFolder(id);

  setLastSelecftedFolder(id);
};

const onCreateFolder = async (event) => {
  const createEl = event.currentTarget;
  const newFolder = document.createElement("li");
  newFolder.className = "navigation__item";

  const folderInput = document.createElement("input");
  newFolder.prepend(folderInput);

  createEl.parentNode.insertBefore(newFolder, createEl);
  folderInput.focus();

  newFolder.addEventListener("keydown", onCreateFolderFinish);
  newFolder.addEventListener("focusout", onResetFolderCreating);
};

const onCreateFolderFinish = async (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const targetFolder = event.currentTarget;
    const name = targetFolder.firstElementChild.value;

    if (name === "") {
      onResetFolderCreating(event);
      return;
    }

    const folder = await createFolder(name);

    const newItem = createNavItem(folder.id, folder.title);
    const order = await getFolderOrder();
    order.push(newItem.id);
    setFolderOrder(order);

    targetFolder.removeEventListener("keydown", onCreateFolderFinish);
    targetFolder.removeEventListener("focusout", onResetFolderCreating);
    targetFolder.replaceWith(newItem);
  }
  if (event.key === "Escape") {
    event.preventDefault();
    onResetFolderCreating(event);
  }
};

const onResetFolderCreating = (event) => {
  event.currentTarget.removeEventListener("keydown", onCreateFolderFinish);
  event.currentTarget.removeEventListener("focusout", onResetFolderCreating);
  event.currentTarget.remove();
};

export const onEditFolder = (event) => {
  const targetFolder = event.currentTarget;
  const id = targetFolder.id;

  const folderInput = document.createElement("input");
  folderInput.value = targetFolder.innerText;
  folderInput.defaultValue = targetFolder.innerText;
  folderInput.id = id;

  targetFolder.innerHTML = "";

  if (id !== "-1") {
    const deleteButton = document.createElement("img");
    deleteButton.className = "navigation__item-icon navigation__item-delete";
    deleteButton.src = chrome.runtime.getURL("assets/delete.svg");
    deleteButton.addEventListener("click", onDeleteFolder);
    targetFolder.append(deleteButton);
  }

  targetFolder.prepend(folderInput);
  folderInput.focus();

  targetFolder.ondblclick = "";

  targetFolder.setAttribute("draggable", false);

  targetFolder.addEventListener("keydown", onSaveFolder);
  targetFolder.addEventListener("focusout", onResetFolder);
};

const onDeleteFolder = async (event) => {
  const parentNode = event.currentTarget.parentNode;
  const res = await deleteFolder(parentNode.id);
  if (res) parentNode.remove();
};

const onSaveFolder = async (event) => {
  const { key } = event;
  if (key === "Enter") {
    const targetFolder = event.currentTarget;
    const id = targetFolder.id;
    const name = targetFolder.firstElementChild.value;

    if (name === "") {
      onResetFolder({ currentTarget: targetFolder });
      return;
    }

    try {
      if (id !== "-1") {
        await updateFolder(id, name);
      } else {
        setUngroupedFolderName(name);
      }

      targetFolder.innerText = name;

      targetFolder.ondblclick = onEditFolder;

      targetFolder.draggable = true;

      targetFolder.removeEventListener("keydown", onSaveFolder);
      targetFolder.removeEventListener("focusout", onResetFolder);
    } catch (e) {
      alert("Something went wrong. Can't update folder name");
      console.error(e);
    }
  }

  if (key === "Escape") {
    onResetFolder(event);
  }
};

const onResetFolder = (event) => {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  const targetFolder = event.currentTarget;
  const name = targetFolder.children[0].defaultValue;

  targetFolder.innerText = name;
  targetFolder.ondblclick = onEditFolder;

  targetFolder.draggable = true;

  targetFolder.removeEventListener("keydown", onSaveFolder);
  targetFolder.removeEventListener("focusout", onResetFolder);
};

let dragElementId;

export const onDragStartHeaderItem = (event) => {
  event.target.classList.add("navigation__item_droppable");
  dragElementId = event.currentTarget.id;
};

export const onDragEnterHeaderItem = (event) => {
  if (event.currentTarget.id === dragElementId) return;

  const dragElement = document.getElementById(dragElementId);
  const parentNode = event.currentTarget.parentNode;

  for (let i = 0; i < parentNode.children.length; i++) {
    if (parentNode.children[i].id === dragElementId) {
      dragElement.parentNode.insertBefore(
        dragElement,
        event.currentTarget.nextSibling
      );
      break;
    } else if (parentNode.children[i].id === event.currentTarget.id) {
      parentNode.insertBefore(dragElement, event.currentTarget);
      break;
    }
  }
};

export const onDragEndHeaderItem = (event) => {
  event.target.classList.remove("navigation__item_droppable");

  const navigator = document.getElementById("nav").children[0];
  const ids = [];
  for (let i = 0; i < navigator.children.length; i++) {
    ids.push(navigator.children[i].id);
  }

  setFolderOrder(ids);
};
