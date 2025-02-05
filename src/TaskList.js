import { format } from 'date-fns';

class TaskList {
    constructor(dataManager, ui) {
        this.dataManager = dataManager;
        this.ui = ui;
    }

    updateMainSection(currentList) {
        const titleDiv = document.querySelector(".title");
        switch (currentList.name.toLowerCase()) {
            case this.ui.constructor.CLASS_NAMES.TASKS:
                titleDiv.innerHTML = `
                <i class="fa-solid fa-house"></i>
                <h1>${currentList.name}</h1>
            `;
                break;
            case this.ui.constructor.CLASS_NAMES.TODAY:
                titleDiv.innerHTML = `
                <h1 class="list-name">Today</h1>
                ${this.getTodayTitle()}
            `;
                break;
            case this.ui.constructor.CLASS_NAMES.IMPORTANT:
                titleDiv.innerHTML = `
                <i class="fa-regular fa-star"></i>
                <h1>${currentList.name}</h1>
            `;
                break;
            case this.ui.constructor.CLASS_NAMES.PLANNED:
                titleDiv.innerHTML = `
                <i class="fa-solid fa-list-check"></i>
                <h1>${currentList.name}</h1>
            `;
                break;
            default:
                titleDiv.innerHTML = `<h1 class="list-name">${currentList.name}</h1>`;
        }
    }

    getTodayTitle() {
        const date = new Date();
        const formattedDate = format(date, 'EEEE, MMMM do'); // Format the date using date-fns
        return `
            <p>${formattedDate}</p>
        `;
    }

    getTaskListNames(task) {
        const currentListId = this.dataManager.currentListId;
        const currentList = this.dataManager.getListById(currentListId);
        
        // Get all lists that contain this task
        const listNames = this.dataManager.lists
            .filter(list => 
                // Only include list if:
                // 1. It contains the task
                // 2. It's not the current list
                // 3. If current list is not default, show all default lists
                // 4. If current list is default, don't show other default lists
                list.tasks.includes(task) && 
                list.id !== currentListId &&
                ((!currentList.isDefault && list.isDefault) || 
                 (currentList.isDefault && !list.isDefault) ||
                 (!currentList.isDefault && !list.isDefault))
            )
            .map(list => list.name);

        return listNames;
    }

    handleTaskCompletion(taskId) {
        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        const task = currentList.tasks.find(task => task.id === taskId);
        if (task) {
            task.toggleCompletion();
            this.ui.renderTasks();
            this.ui.renderSidebar();
            this.dataManager.saveToStorage(); // Add this line

            // Update the options panel if it's open
            const optionSection = document.querySelector(".option");
            if (!optionSection.classList.contains("hidden")) {
                const optionCheckbox = optionSection.querySelector(`input[id="${taskId}"]`);
                const optionTitle = optionSection.querySelector(".task-title");
                if (optionCheckbox && optionTitle) {
                    optionCheckbox.checked = task.isCompleted;
                    optionTitle.classList.toggle("completed", task.isCompleted);
                }
            }
        }
    }

    handleTaskImportant(taskId) {
        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        const task = currentList.tasks.find(task => task.id === taskId);
        if (task) {
            task.markAsImportant();
            const importantList = this.dataManager.getListByName("Important");
            if (task.isImportant) {
                importantList.addTask(task);
            } else {
                importantList.removeTask(taskId);
            }
            this.updateTaskDetailsInDOM(task);
            this.ui.renderSidebar();
            // Add this line to save state
            this.dataManager.saveToStorage();

            // Update the options panel if it's open
            const optionSection = document.querySelector(".option");
            if (!optionSection.classList.contains("hidden")) {
                const optionStarIcon = optionSection.querySelector(".option-task-info .mark-important i");
                if (optionStarIcon) {
                    optionStarIcon.className = `fa-${task.isImportant ? 'solid' : 'regular'} fa-star`;
                }
            }
        }
    }

    toggleCompletedTasks() {
        const completedTasksContainer = document.querySelector(".tasks-container-completed");
        const toggleButton = document.getElementById("toggle-completed");
        const isHidden = completedTasksContainer.classList.toggle("hidden");
        toggleButton.querySelector("i").classList.toggle("fa-arrow-right", isHidden);
        toggleButton.querySelector("i").classList.toggle("fa-arrow-down", !isHidden);
    }

    handleAddTask() {
        const addTask = document.querySelector(".add-task-container");
        addTask.classList.add("active");

        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        if (currentList.name === "Planned") {
            addTask.classList.add("planned");
            addTask.innerHTML = `
                <div>
                    <i class="fa-regular fa-circle"></i>
                    <input type="text" class="add-task-input" placeholder="Try typing 'Publish a novel chapter'">
                </div>
                <input type="date" class="add-task-due-date">
                <span class="error-message">Please enter due date</span>`;
        } else {
            addTask.innerHTML = `
                <i class="fa-regular fa-circle"></i>
                <input type="text" class="add-task-input" placeholder="Try typing 'Publish a novel chapter'">`;
        }

        const addTaskInput = addTask.querySelector(".add-task-input");
        addTaskInput.focus();

        const saveTask = () => {
            const taskName = addTaskInput.value.trim();
            let dueDate = null;
            if (currentList.name === "Planned") {
                const dueDateInput = addTask.querySelector(".add-task-due-date");
                dueDate = dueDateInput.value;
                const errorMessage = addTask.querySelector(".error-message");

                if (!dueDate && taskName) {
                    errorMessage.textContent = "Please select a due-date!";
                    errorMessage.style.display = "block";
                    return;
                }

                if (dueDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(dueDate);
                    if (selectedDate < today) {
                        errorMessage.textContent = "Please select a future date";
                        errorMessage.style.display = "block";
                        return;
                    }
                }
            }

            if (taskName) {
                addTask.classList.remove("active");
                addTask.innerHTML = `
                    <button class="add-task" id="add-task">
                        <i class="fa-solid fa-plus"></i>
                        <span>Add a task</span>
                    </button>`;
                this.dataManager.createTask(this.dataManager.currentListId, taskName, "", dueDate);
                this.ui.renderTasks();
                // Reattach the event listener for the add-task button
                document.getElementById("add-task").addEventListener("click", () => this.ui.handleAddTask());
                this.ui.renderSidebar();
            } else {
                // If the input is empty, reset the add-task button
                addTask.classList.remove("active");
                addTask.innerHTML = `
                    <button class="add-task" id="add-task">
                        <i class="fa-solid fa-plus"></i>
                        <span>Add a task</span>
                    </button>`;
                document.getElementById("add-task").addEventListener("click", () => this.ui.handleAddTask());
            }
        }

        addTaskInput.addEventListener("blur", saveTask);
        addTaskInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                addTaskInput.removeEventListener("blur", saveTask);
                saveTask();
            }
        });
    }

    renderTasks() {
        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        const tasks = currentList.tasks;
        const tasksContainer = document.querySelector(".tasks-container");
        const completedTasksContainer = document.querySelector(".tasks-container-completed");
        tasksContainer.innerHTML = "";
        completedTasksContainer.innerHTML = "";

        tasks.forEach(task => {
            const taskItem = document.createElement("li");
            taskItem.className = "task-item";
            taskItem.setAttribute("data-id", task.id);
            taskItem.innerHTML = `
                <div>
                    <label for="${task.id}">
                        <input type="checkbox" id="${task.id}" ${task.isCompleted ? "checked" : ""}>
                        <span></span>
                    </label>
                    <div class="task-info">
                        <h4 class="task-name">${task.title}</h4>
                        <ul class="task-details">
                            ${this.getTaskDetailsHTML(task)}
                        </ul>
                    </div>
                </div>
                <button id="mark-important" class="mark-important">
                    <i class="fa-${task.isImportant ? 'solid' : 'regular'} fa-star"></i>
                </button>`;
            taskItem.querySelector("input[type='checkbox']").addEventListener("change", (e) => {
                e.stopPropagation(); // Prevent opening options
                this.handleTaskCompletion(task.id);
            });
            taskItem.querySelector("#mark-important").addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent opening options
                this.handleTaskImportant(task.id);
            });
            taskItem.querySelector(".task-info").addEventListener("click", () => this.ui.renderOptions(task));
            if (task.isCompleted) {
                completedTasksContainer.appendChild(taskItem);
            } else {
                tasksContainer.appendChild(taskItem);
            }
        });

        const completedSection = document.querySelector(".completed-section");
        const completedTasksCount = completedTasksContainer.children.length;
        completedSection.style.display = completedTasksCount > 0 ? "block" : "none";
        document.querySelector(".num-of-task-completed").textContent = completedTasksCount;
    }

    updateTaskDetailsInDOM(task) {
        const taskItem = document.querySelector(`.task-item[data-id="${task.id}"]`);
        if (taskItem) {
            const taskDetails = taskItem.querySelector(".task-details");
            taskDetails.innerHTML = this.getTaskDetailsHTML(task);
            const importantIcon = taskItem.querySelector("#mark-important i");
            importantIcon.className = `fa-${task.isImportant ? 'solid' : 'regular'} fa-star`;
        }
    }

    getTaskDetailsHTML(task) {
        const taskDetails = [];
        const currentListId = this.dataManager.currentListId;
        const currentList = this.dataManager.getListById(currentListId);
        
        // Get all lists this task belongs to (except current list and Planned list)
        const taskLists = this.dataManager.lists
            .filter(list => 
                list.tasks.includes(task) && 
                list.id !== currentListId && 
                list.name !== 'Planned'
            )
            .map(list => list.name);
            
        // Add all list names to details
        taskDetails.push(...taskLists);

        // Always show due date if task has one, regardless of current list
        if (task.dueDate) {
            const dueDate = format(new Date(task.dueDate), 'MMM d');
            taskDetails.push(`<i class="fa-solid fa-list-check"></i> ${dueDate}`);
        }

        // Add steps count if has steps
        if (task.steps && task.steps.length > 0) {
            const completedSteps = task.steps.filter(step => step.isCompleted).length;
            taskDetails.push(`${completedSteps} of ${task.steps.length}`);
        }

        // Add notes icon if has description
        if (task.hasNotes()) {
            taskDetails.push('<i class="fa-regular fa-note-sticky"></i>');
        }

        return taskDetails.map(name => `<li>${name}</li>`).join("");
    }
}

export { TaskList };
