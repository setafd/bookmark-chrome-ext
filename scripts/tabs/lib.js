import { renderFolder } from "../bookmarks/ui.js";
import { setFolderOrder, setLastSelecftedFolder, setUngroupedFolderName } from "../store/api.js";
import { updateFolder } from "./api.js";

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

export const onEditFolder = (event) => {
  const targetFolder = event.currentTarget;
  const id = targetFolder.id;

  const folderInput = document.createElement("input");
  folderInput.value = targetFolder.innerText;
  folderInput.defaultValue = targetFolder.innerText;
  folderInput.id = id;

  targetFolder.innerHTML = "";

  targetFolder.prepend(folderInput);
  folderInput.focus();

  targetFolder.ondblclick = "";

  targetFolder.setAttribute("draggable", false);

  targetFolder.addEventListener("keydown", onSaveFolder);
  targetFolder.addEventListener("focusout", onResetFolder);
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
