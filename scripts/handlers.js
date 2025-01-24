const onChangeFolder = (event) => {
  const selectedEl = document.querySelector(".navigation__item_selected");
  if (selectedEl === event.currentTarget) return;

  selectedEl?.classList.remove("navigation__item_selected");
  event.currentTarget.classList.add("navigation__item_selected");

  const id = event.target.id;
  if (id === "-1") {
    renderUngroupedFolder();
  } else {
    renderFolder(id);
  }

  chrome.storage.session.set({ last: id });
};

const onEditFolderName = (event) => {
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

  if (targetFolder.classList.contains("navigation__item")) {
    targetFolder.setAttribute("draggable", "false");
    targetFolder.ondragstart = "";
    targetFolder.ondragend = "";
    targetFolder.ondragenter = "";
  }

  targetFolder.addEventListener("keydown", saveFolderName);
  targetFolder.addEventListener("focusout", resetFolderName);
};

const saveFolderName = async (event) => {
  const { key } = event;
  if (key === "Enter") {
    const targetFolder = event.currentTarget;
    const id = targetFolder.id;
    const name = targetFolder.children[0].value;

    if (name === "") {
      resetFolderName({ currentTarget: targetFolder });
      return;
    }

    try {
      if (id !== "-1") {
        await editFolderTitle(id, name);
      } else {
        chrome.storage.sync.set({ ungroupedFolderName: name });
      }

      targetFolder.innerHTML = name;

      targetFolder.ondblclick = onEditFolderName;

      targetFolder.draggable = "true";
      targetFolder.ondragstart = onDragStartHeaderItem;
      targetFolder.ondragend = onDragEndHeaderItem;
      targetFolder.ondragenter = onDragEnterHeaderItem;
    } catch (e) {
      alert("Something went wrong. Can't update folder name");
      console.error(e);
    }
  }

  if (key === "Escape") {
    resetFolderName(event);
  }
};

const resetFolderName = (event) => {
  const targetFolder = event.currentTarget;
  const name = targetFolder.children[0].defaultValue;

  targetFolder.innerText = name;
  targetFolder.ondblclick = onEditFolderName;

  if (targetFolder.classList.contains("navigation__item")) {
    targetFolder.draggable = "true";
    targetFolder.ondragstart = onDragStartHeaderItem;
    targetFolder.ondragend = onDragEndHeaderItem;
    targetFolder.ondragenter = onDragEnterHeaderItem;
  }

  targetFolder.removeEventListener("keydown", saveFolderName);
  targetFolder.removeEventListener("focusout", resetFolderName);
};

const onEditBookmark = async (event) => {
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

  editForm.querySelector('button[type="reset"]').onclick = () => {
    deleteButton.classList.add("bookmark-form__delete-btn_hidden");
    editDialog.close();
  };

  editForm.onsubmit = async (event) => {
    event.preventDefault();

    const bookmarkItem = document.querySelector(`li[data-url="${url}"]`);

    title = titleInput.value;
    url = urlInput.value;
    await chrome.bookmarks.update(bookmarkId, { title, url });

    bookmarkItem.setAttribute("data-url", url);
    bookmarkItem.getElementsByTagName("span")[0].textContent = title;
    deleteButton.classList.add("bookmark-form__delete-btn_hidden");
    editDialog.close();
  };

  deleteButton.onclick = async () => {
    await deleteBookmark(bookmarkId);

    // Really lazy again :9
    const selectedTab = document.querySelector("navigation__item_selected");
    if (selectedTab.id !== "-1") {
      renderFolder(selectedTab.id);
    } else {
      renderUngroupedFolder();
    }
    editDialog.close();
  };
};

const onCreateBookmark = async (event) => {
  event.stopPropagation();
  const folderId = event.currentTarget.parentNode.id;

  const editDialog = document.getElementById("dialog");
  const editForm = document.getElementById("edit-bookmark");

  editDialog.showModal();

  editForm.querySelector('button[type="reset"]').onclick = () => {
    editDialog.close();
  };

  editForm.onsubmit = async (event) => {
    event.preventDefault();
    const [titleInput, urlInput] = editForm.getElementsByTagName("input");
    title = titleInput.value;
    url = urlInput.value;

    try {
      await createBookmark(title, url, folderId);

      // Really lazy :9
      const selectedTab = document.querySelector("navigation__item_selected");
      renderFolder(selectedTab.id);
      editDialog.close();
    } catch (e) {
      alert(e);
    }
  };
};

let dragElementId;

const onDragStartHeaderItem = (event) => {
  event.target.classList.add("navigation__item_droppable");
  dragElementId = event.target.id;
};

const onDragEnterHeaderItem = (event) => {
  if (event.target.id === dragElementId) return;

  const dragElement = document.getElementById(dragElementId);
  const parentNode = event.target.parentNode;

  for (let i = 0; i < parentNode.children.length; i++) {
    if (parentNode.children[i].id === dragElementId) {
      dragElement.parentNode.insertBefore(
        dragElement,
        event.target.nextSibling
      );
      break;
    } else if (parentNode.children[i].id === event.target.id) {
      parentNode.insertBefore(dragElement, event.target);
      break;
    }
  }
};

const onDragEndHeaderItem = (event) => {
  event.target.classList.remove("navigation__item_droppable");

  const navigator = document.getElementById("nav").children[0];
  const ids = [];
  for (let i = 0; i < navigator.children.length; i++) {
    ids.push(navigator.children[i].id);
  }

  chrome.storage.sync.set({ order: ids });
};

const onDragStartFolderItem = (event) => {
  event.target.classList.add("card__item_droppable");
  dragElementId = event.target.id;
};

const onDragEnterFolderItem = (event) => {
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

const onDragEndFolderItem = async (event) => {
  event.target.classList.remove("card__item_droppable");

  const bookmark = (await chrome.bookmarks.get(event.target.id))[0];
  const newIndex = Array.prototype.indexOf.call(
    event.target.parentNode.children,
    event.target
  );
  const parentId = event.target.parentNode.id;

  if (newIndex === event.target.parentNode.children.length - 2) {
    await chrome.bookmarks.move(bookmark.id, { parentId });
  } else {
    await chrome.bookmarks.move(bookmark.id, {
      parentId,
      index: newIndex,
    });
  }
};
