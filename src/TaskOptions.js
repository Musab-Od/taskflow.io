import { format } from 'date-fns';

class TaskOptions {
    constructor(dataManager, ui) {
        this.dataManager = dataManager;
        this.ui = ui;
    }

    updateListClass() {
        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        const option = document.querySelector(".option");
        if (!option.classList.contains("hidden")) {
            // Remove any existing list-specific classes
            option.className = "option";
            // Add the appropriate class based on the current list
            option.classList.add(`${currentList.isDefault ? currentList.name.toLowerCase() : 'custom'}-list`);
        }
    }

    renderOptions(task) {
        const option = document.querySelector(".option");
        const pageLayout = document.querySelector(".page-layout");
        option.classList.remove("hidden");
        this.updateListClass();
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
                        <div>
                            <label for="${task.id}">
                                <input type="checkbox" id="${task.id}" ${task.isCompleted ? "checked" : ""}>
                                <span></span>
                            </label>
                            <h4 class="task-title ${task.isCompleted ? 'completed' : ''}">${task.title}</h4>
                        </div>
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
        const todayList = this.dataManager.getListByName("Today");
        const isInToday = todayList.tasks.some(t => t.id === task.id);
        
        if (isInToday || task.isInToday) {
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
        this.setupMarkCompleteEvent(task);
        this.setupTaskTitleEditEvent(task);
        this.setupAddStepEvent(task);
        this.setupAddToMyDayEvent(task);
        this.setupAddDueDateEvent(task);
        this.setupTaskNotesEvent(task);
        this.setupDeleteTaskEvent(task);
    }

    setupCloseOptionEvent() {
        const closeBtn = document.getElementById("close-option");
        closeBtn.addEventListener("click", () => {
            const optionSection = document.querySelector(".option");
            optionSection.classList.add("hidden");
            document.querySelector(".page-layout").classList.remove("option-active");
            
            // Add this condition to handle mobile navigation
            if (this.ui.isMobile) {
                this.ui.showMobileView('tasks');
            }
        });
    }

    setupMarkImportantEvent(task) {
        const markImportantBtn = document.querySelector(".option-task-info .mark-important");
        markImportantBtn.addEventListener("click", () => {
            task.markAsImportant();
            const importantList = this.dataManager.getListByName("Important");
            if (task.isImportant) {
                importantList.addTask(task);
            } else {
                importantList.removeTask(task.id);
            }
            this.ui.updateTaskDetailsInDOM(task);
            this.ui.renderSidebar();
            this.dataManager.saveToStorage();
            // Update the options section without re-rendering
            const importantIcon = document.querySelector(".option-task-info .mark-important i");
            importantIcon.className = `fa-${task.isImportant ? 'solid' : 'regular'} fa-star`;
        });
    }

    setupMarkCompleteEvent(task) {
        const checkbox = document.querySelector(".option-task-info input[type='checkbox']");
        const taskTitle = document.querySelector(".option-task-info .task-title");
        
        checkbox.addEventListener("change", (e) => {
            e.stopPropagation();
            task.toggleCompletion();
            taskTitle.classList.toggle("completed", task.isCompleted);
            this.ui.renderTasks();
            this.ui.renderSidebar();
            this.dataManager.saveToStorage();
        });
    }

    setupTaskTitleEditEvent(task) {
        const taskTitle = document.querySelector(".option-task-info .task-title");
        taskTitle.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = task.title;
            input.className = "task-title-input";
            input.style.cssText = `
                width: 100%;
                background: none;
                border: none;
                border-bottom: 2px solid var(--option-text-color);
                color: var(--option-font-color);
                font-size: inherit;
                padding: 2px 0;
                outline: none;
            `;

            const handleTitleUpdate = () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== task.title) {
                    // Store the current list ID
                    const currentListId = this.dataManager.currentListId;

                    // Update task title
                    task.updateTitle(newTitle);
                    
                    // Update the task in all lists
                    this.dataManager.lists.forEach(list => {
                        if (list.tasks.includes(task)) {
                            // Temporarily switch to this list and render its tasks
                            this.dataManager.currentListId = list.id;
                            this.ui.renderTasks();
                        }
                    });

                    // Restore the original current list
                    this.dataManager.currentListId = currentListId;
                    
                    // Update the current view
                    this.ui.updateTaskDetailsInDOM(task);
                    this.ui.renderTasks();
                    this.dataManager.saveToStorage();
                }
                
                // Recreate title element
                const newTitleElement = document.createElement("h4");
                newTitleElement.className = `task-title ${task.isCompleted ? 'completed' : ''}`;
                newTitleElement.textContent = task.title;
                input.replaceWith(newTitleElement);
                
                // Reattach click event to new element
                this.setupTaskTitleEditEvent(task);
            };

            input.addEventListener("blur", handleTitleUpdate);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    input.removeEventListener("blur", handleTitleUpdate);
                    handleTitleUpdate();
                }
            });

            taskTitle.replaceWith(input);
            input.focus();
            input.select();
        });
    }

    setupAddStepEvent(task) {
        const addStepBtn = document.getElementById("add-step");
        const stepsList = document.querySelector(".steps-list");

        // First bind events to existing steps
        stepsList.querySelectorAll('.step-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const stepId = e.target.id.replace('step-', '');
                this.dataManager.toggleStepCompletion(task.id, stepId);
                this.ui.updateTaskDetailsInDOM(task);
                this.dataManager.saveToStorage();
            });
        });

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
                        
                        // Add event listener for the new step
                        stepItem.querySelector("input[type='checkbox']").addEventListener("change", () => {
                            this.dataManager.toggleStepCompletion(task.id, step.id);
                            this.ui.updateTaskDetailsInDOM(task);
                            this.ui.renderTasks(); // Add this to update main task list
                            this.dataManager.saveToStorage();
                        });
                    }
                }
                stepInputLi.remove();
                this.ui.updateTaskDetailsInDOM(task);
                this.ui.renderTasks();
                this.dataManager.saveToStorage();
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
        const todayList = this.dataManager.getListByName("Today");
        
        addToMyDayBtn.addEventListener("click", () => {
            task.toggleMyDay();
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
            // Add this line to save state
            this.dataManager.saveToStorage();
        });
    }

    setupAddDueDateEvent(task) {
        const addDueDateBtn = document.getElementById("add-due-date");
        const nameSpan = addDueDateBtn.querySelector(".name");
        let dateInput = null;
        let errorMessage = null;

        const showError = (message) => {
            if (!errorMessage) {
                errorMessage = document.createElement("span");
                errorMessage.className = "error-message";
                addDueDateBtn.parentElement.appendChild(errorMessage);
            }
            errorMessage.textContent = message;
            errorMessage.style.display = "block";
        };

        const hideError = () => {
            if (errorMessage) {
                errorMessage.style.display = "none";
            }
        };

        const handleDateSelection = () => {
            if (dateInput && dateInput.value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDate = new Date(dateInput.value);
                selectedDate.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    showError("Please select a future date!");
                    return;
                }

                hideError();
                task.setDueDate(dateInput.value);
                addDueDateBtn.classList.add("added");
                nameSpan.textContent = format(selectedDate, 'MMM d');
                dateInput.remove();
                dateInput = null;

                if (selectedDate.getTime() === today.getTime()) {
                    task.isInToday = true;
                    const todayList = this.dataManager.getListByName("Today");
                    todayList.addTask(task);
                }

                const plannedList = this.dataManager.getListByName("Planned");
                if (selectedDate >= today) {
                    plannedList.addTask(task);
                }

                this.ui.updateTaskDetailsInDOM(task);
                this.ui.renderSidebar();
                this.dataManager.saveToStorage(); // Add this line
            }
        };

        addDueDateBtn.addEventListener("click", () => {
            if (!dateInput) {
                hideError();
                dateInput = document.createElement("input");
                dateInput.type = "date";
                dateInput.value = task.dueDate || "";
                addDueDateBtn.appendChild(dateInput);
                dateInput.click();
                
                dateInput.addEventListener("change", handleDateSelection);
                dateInput.addEventListener("blur", () => {
                    if (!dateInput.value) {
                        dateInput.remove();
                        dateInput = null;
                        hideError();
                    }
                });
            }
        });
    }

    setupTaskNotesEvent(task) {
        const notesTextarea = document.getElementById("task-note");
        notesTextarea.value = task.description;

        // Set initial height
        this.adjustTextareaHeight(notesTextarea);
        
        notesTextarea.addEventListener("input", () => {
            task.updateDescription(notesTextarea.value);
            this.ui.updateTaskDetailsInDOM(task);
            this.adjustTextareaHeight(notesTextarea);
        });
    }

    adjustTextareaHeight(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set new height based on scrollHeight
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    setupDeleteTaskEvent(task) {
        const deleteTaskBtn = document.getElementById("delete-task");
        deleteTaskBtn.addEventListener("click", () => {
            // Use DataManager's deleteTask method
            this.dataManager.deleteTask(task.id);
            
            document.querySelector(".option").classList.add("hidden");
            document.querySelector(".page-layout").classList.remove("option-active");
            
            if (this.ui.isMobile) {
                this.ui.showMobileView('tasks');
            }
            
            this.ui.renderSidebar();
            this.ui.renderTasks();
        });
    }
}

export { TaskOptions };
