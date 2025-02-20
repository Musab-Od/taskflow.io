class Sidebar {
    constructor(dataManager, ui) {
        this.dataManager = dataManager;
        this.ui = ui;
        this.setupContextMenu();
    }

    renderSidebar() {
        const taskCounts = this.dataManager.getTaskCounts();

        // Update default list's task count
        const defaultLists = ["Tasks", "Today", "Important", "Planned"];
        defaultLists.forEach(listName => {
            const list = this.dataManager.getListByName(listName);
            const countSpan = document.querySelector(`#${listName.toLowerCase()} .count`);
            const taskCount = taskCounts[list.id] > 0 ? taskCounts[list.id] : "";
            if (countSpan) {
                countSpan.textContent = taskCount;
            }
        });

        // Set data-id attribute for default lists
        defaultLists.forEach(listName => {
            const listButton = document.getElementById(listName.toLowerCase());
            if (listButton) {
                listButton.setAttribute("data-id", this.dataManager.getListByName(listName).id);
            }
        });

        // Render custom lists
        const customLists = this.dataManager.lists.filter(list => !list.isDefault);
        const sidebarCustomLists = document.querySelector(".sidebar-custom-lists");
        sidebarCustomLists.innerHTML = "";
        customLists.forEach(list => {
            const listElement = document.createElement("li");
            const taskCount = taskCounts[list.id] > 0 ? taskCounts[list.id] : "";
            listElement.innerHTML = `<button class="sidebar-button" id="list" data-id="${list.id}">
                        <div>
                            <i class="fa-solid fa-list"></i>
                            <span class="name">${list.name}</span>
                        </div>
                        <span class="count">${taskCount}</span>
                    </button>`;
            sidebarCustomLists.appendChild(listElement);
        });
    }

    handleListClick(listElement) {
        const listId = listElement.dataset.id;
        this.dataManager.setCurrentList(listId);

        // Add selected class to the clicked list and remove it from the others
        document.querySelectorAll(".sidebar-button").forEach(button => {
            button.classList.toggle("selected", button === listElement);
        });

        // Update the main section's class based on the selected list's name
        const currentList = this.dataManager.getListById(listId);
        const main = document.getElementById("main");
        main.className = currentList.isDefault ? currentList.name.toLowerCase() : this.ui.constructor.CLASS_NAMES.LIST;
        
        // Update the options panel list class if it's open
        this.ui.taskOptions.updateListClass();
        
        this.ui.updateMainSection(currentList);
        this.ui.renderTasks(); // Ensure tasks are rendered for the selected list

        // Reset the add-task button
        const addTaskContainer = document.querySelector(".add-task-container");
        addTaskContainer.classList.remove("active", "planned");
        addTaskContainer.innerHTML = `
            <button class="add-task" id="add-task">
                <i class="fa-solid fa-plus"></i>
                <span>Add a task</span>
            </button>`;
        document.getElementById("add-task").addEventListener("click", () => this.ui.handleAddTask());
    }

    handleAddList() {
        const sidebarCustomLists = document.querySelector(".sidebar-custom-lists");
        const addListInputLi = document.createElement("li");
        addListInputLi.innerHTML = `
            <button class="sidebar-button" id="list">
                <div>
                    <i class="fa-solid fa-list"></i>
                    <input type="text" class="add-list-input">
                </div>
                <span class="count"></span>
            </button>`;
        sidebarCustomLists.appendChild(addListInputLi);

        const addListInput = addListInputLi.querySelector(".add-list-input");
        addListInput.value = "Untitled List";
        addListInput.focus();
        addListInput.setSelectionRange(0, addListInput.value.length);

        const saveList = () => {
            const listName = addListInput.value.trim() || "Untitled List";
            addListInputLi.innerHTML = "";
            this.dataManager.createList(listName);
            this.renderSidebar();
        };

        addListInput.addEventListener("blur", saveList);
        addListInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                addListInput.removeEventListener("blur", saveList); // Clean up event listener to prevent multiple calls
                saveList();
            }
        });
    }

    setupContextMenu() {
        const contextMenu = document.querySelector('.list-context-menu');
        let currentListElement = null;

        // Handle right click on custom lists
        document.querySelector('.sidebar-custom-lists').addEventListener('contextmenu', (e) => {
            const listButton = e.target.closest('.sidebar-button');
            if (!listButton) return;
            
            e.preventDefault();
            currentListElement = listButton;
            
            // Position the context menu
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.classList.remove('hidden');
        });

        // Handle rename list
        contextMenu.querySelector('.rename-list').addEventListener('click', () => {
            if (!currentListElement) return;
            
            const listId = currentListElement.dataset.id;
            const currentList = this.dataManager.getListById(listId);
            const nameSpan = currentListElement.querySelector('.name');
            
            // Create input for renaming
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentList.name;
            input.className = 'add-list-input';
            
            nameSpan.replaceWith(input);
            input.focus();
            input.select();

            const handleRename = () => {
                const newName = input.value.trim();
                if (newName && newName !== currentList.name) {
                    currentList.name = newName;
                    this.dataManager.saveToStorage();
                    this.renderSidebar();
                } else {
                    input.replaceWith(nameSpan);
                }
            };

            input.addEventListener('blur', handleRename);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.removeEventListener('blur', handleRename);
                    handleRename();
                }
            });
            
            contextMenu.classList.add('hidden');
        });

        // Handle delete list
        contextMenu.querySelector('.delete-list').addEventListener('click', () => {
            if (!currentListElement) return;
            
            const listId = currentListElement.dataset.id;
            this.dataManager.deleteList(listId);
            
            // Switch to Tasks list
            const tasksButton = document.getElementById('tasks');
            this.ui.handleListClick(tasksButton);
            
            this.renderSidebar();
            contextMenu.classList.add('hidden');

            // Close the options panel if it's open
            document.querySelector(".option").classList.add("hidden");
            document.querySelector(".page-layout").classList.remove("option-active");
        });

        // Close context menu when clicking outside
        document.addEventListener('click', () => {
            contextMenu.classList.add('hidden');
        });
    }
}

export { Sidebar };
