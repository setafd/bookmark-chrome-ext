import { onChangeFolder, onDragEndHeaderItem, onDragEnterHeaderItem, onDragStartHeaderItem, onEditFolder } from "./lib.js";

export const createNavContainer = () => {
  const navigator = document.getElementById("nav");
  const list = document.createElement("ul");
  list.className = "navigation__wrapper";
  navigator.prepend(list);

  return list;
};

export const createNavItem = (id, title) => {
  const item = document.createElement("li");
  item.className = "navigation__item";
  item.tabIndex = 0;
  item.textContent = title;

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
