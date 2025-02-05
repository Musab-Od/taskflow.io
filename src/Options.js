import { format } from 'date-fns';

class Options {
    constructor(dataManager, ui) {
        this.dataManager = dataManager;
        this.ui = ui;
    }

    renderOptions(task) {
        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        const option = document.querySelector(".option");
        const pageLayout = document.querySelector(".page-layout");
        option.classList.remove("hidden");
        option.classList.add(`${currentList.isDefault ? currentList.name.toLowerCase() : 'custom'}-list`);
        pageLayout.classList.add("option-active");

        option.innerHTML = `
        <div class="option-container">
                <div class="option-exit-button">
                    <button id="close-option">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="task-steps">
                    <div class="option-task-info">
                        <h4 class="task-title">${task.title}</h4>
                        <button id="mark-important" class="mark-important">
                            <i class="fa-${task.isImportant ? 'solid' : 'regular'} fa-star"></i>
                        </button>
                    </div>
                    <ul class="steps-list">
                        ${task.steps.map(step => `
                            <li class="step-item">
                                <label for="step-${step.id}">
                                    <input type="checkbox" id="step-${step.id}" 
                                        ${step.isCompleted ? "checked" : ""}>
                                    <span></span>
                                </label>
                                <h5 class="step-title">${step.name}</h5>
                            </li>
                        `).join('')}
                        <li class="adding-step">
                            <i class="fa-solid fa-plus"></i>
                            <button id="add-step" class="add-step">
                                <span>Add a Step</span>
                            </button>
                        </li>
                    </ul>
                </div>
                <div class="task-options">
                    <ul>
                        <li>
                            <button class="add-to-my-day" id="add-to-my-day">
                                <i class="fa-regular fa-clock"></i>
                                <span class="name">Add to My Day</span>
                            </button>
                        </li>
                        <li>
                            <button class="add-due-date" id="add-due-date">
                                <i class="fa-solid fa-list-check"></i>
                                <span class="name">Add Due Date</span>
                            </button>
                        </li>
                    </ul>
                </div>
                <div class="task-notes">
                    <label for="task-note"></label>
                    <textarea name="task-note" id="task-note" placeholder="Add note">${task.description}</textarea>
                </div>
            </div>
            <div class="delete-task">
                ${this.ui.getTodayTitle()}
                <button id="delete-task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Update add to my day button state
        const addToMyDayBtn = document.querySelector('.add-to-my-day');
        if (task.isInToday) {
            addToMyDayBtn.classList.add('added');
            addToMyDayBtn.querySelector('.name').textContent = 'Added to My Day';
        }

        // Update due date button state
        const addDueDateBtn = document.querySelector('.add-due-date');
        if (task.dueDate) {
            addDueDateBtn.classList.add('added');
            addDueDateBtn.querySelector('.name').textContent = format(new Date(task.dueDate), 'MMM d');
        }

        this.setupOptionEvents(task);
    }

    setupOptionEvents(task) {
        this.setupCloseOptionEvent();
        this.setupMarkImportantEvent(task);
        this.setupAddStepEvent(task);
        this.setupAddToMyDayEvent(task);
        this.setupTaskNotesEvent(task);
        this.setupDeleteTaskEvent(task);
    }

    setupCloseOptionEvent() {
        const closeBtn = document.getElementById("close-option");
        closeBtn.addEventListener("click", () => {
            const optionSection = document.querySelector(".option");
            optionSection.classList.add("hidden");
            document.querySelector(".page-layout").classList.remove("option-active");
        });
    }

    setupMarkImportantEvent(task) {
        const markImportantBtn = document.querySelector(".option-task-info .mark-important");
        markImportantBtn.addEventListener("click", () => {
            task.markAsImportant();
            this.ui.updateTaskDetailsInDOM(task);
            this.renderOptions(task); // Re-render options to reflect changes
        });
    }

    setupAddStepEvent(task) {
        const addStepBtn = document.getElementById("add-step");
        addStepBtn.addEventListener("click", () => {
            const stepsList = document.querySelector(".steps-list");
            const stepInputLi = document.createElement("li");
            stepInputLi.className = "step-input";
            stepInputLi.innerHTML = `
                <i class="fa-regular fa-circle"></i>
                <input type="text" class="add-step-input" placeholder="Add a step">
            `;
            
            const addingStepLi = stepsList.querySelector(".adding-step");
            stepsList.insertBefore(stepInputLi, addingStepLi);
            
            const input = stepInputLi.querySelector("input");
            input.focus();
            
            const handleStepAdd = () => {
                const stepName = input.value.trim();
                if (stepName) {
                    const step = this.dataManager.addStepToTask(task.id, stepName);
                    if (step) {
                        const stepItem = document.createElement("li");
                        stepItem.className = "step-item";
                        stepItem.innerHTML = `
                            <label for="step-${step.id}">
                                <input type="checkbox" id="step-${step.id}">
                                <span></span>
                            </label>
                            <h5 class="step-title">${stepName}</h5>
                        `;
                        stepsList.insertBefore(stepItem, addingStepLi);
                        stepItem.querySelector("input[type='checkbox']").addEventListener("change", () => {
                            this.dataManager.toggleStepCompletion(task.id, step.id);
                            this.ui.updateTaskDetailsInDOM(task);
                        });
                    }
                }
                stepInputLi.remove();
                this.ui.renderTasks();
            };

            input.addEventListener("blur", handleStepAdd);
            input.addEventListener("keydown", e => {
                if (e.key === "Enter") {
                    input.removeEventListener("blur", handleStepAdd);
                    handleStepAdd();
                }
            });
        });
    }

    setupAddToMyDayEvent(task) {
        const addToMyDayBtn = document.getElementById("add-to-my-day");
        addToMyDayBtn.addEventListener("click", () => {
            task.toggleMyDay();
            const todayList = this.dataManager.getListByName("Today");
            if (task.isInToday) {
                todayList.addTask(task);
                addToMyDayBtn.classList.add("added");
                addToMyDayBtn.querySelector(".name").textContent = "Added to My Day";
            } else {
                todayList.removeTask(task.id);
                addToMyDayBtn.classList.remove("added");
                addToMyDayBtn.querySelector(".name").textContent = "Add to My Day";
            }
            this.ui.updateTaskDetailsInDOM(task);
            this.ui.renderSidebar();
        });
    }

    setupTaskNotesEvent(task) {
        const notesTextarea = document.getElementById("task-note");
        notesTextarea.value = task.description;
        notesTextarea.addEventListener("input", () => {
            task.updateDescription(notesTextarea.value);
            this.ui.updateTaskDetailsInDOM(task);
        });
    }

    setupDeleteTaskEvent(task) {
        const deleteTaskBtn = document.getElementById("delete-task");
        deleteTaskBtn.addEventListener("click", () => {
            this.dataManager.lists.forEach(list => list.removeTask(task.id));
            document.querySelector(".option").classList.add("hidden");
            document.querySelector(".page-layout").classList.remove("option-active");
            this.ui.renderSidebar();
            this.ui.renderTasks();
        });
    }
}

export { Options };
