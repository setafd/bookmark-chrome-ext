import {
  onChangeFolder,
  onDragEndHeaderItem,
  onDragEnterHeaderItem,
  onDragStartHeaderItem,
  onEditFolder,
} from "./lib.js";

export const getNav = () => {
  const navigator = document.getElementById("nav");
  const list = navigator.querySelector("ul");

  return list;
};

export const createNavItem = (id, title) => {
  const item = document.createElement("li");
  item.className = "navigation__item";
  item.tabIndex = 0;

  const textEl = document.createElement('span');
  textEl.className = "navigation__item-text"
  textEl.textContent = title;

  item.prepend(textEl);

  item.onclick = onChangeFolder;
  item.onkeydown = (event) => {
    if (event.key === "Enter") onChangeFolder(event);
  };
  item.id = id;

  item.ondblclick = onEditFolder;
  item.draggable = "true";
  item.ondragstart = onDragStartHeaderItem;
  item.ondragend = onDragEndHeaderItem;
  item.ondragenter = onDragEnterHeaderItem;

  return item;
};
