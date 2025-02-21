import { StorageManager } from './StorageManager';

// Step Class

class Step {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.isCompleted = false;
    }

    toggleCompletion() {
        this.isCompleted = !this.isCompleted;
    }
}

// Task Class

class Task {
    constructor (id, title, description = "", dueDate = null, isImportant = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.isImportant = isImportant;
        this.isInToday = false;
        this.isCompleted = false;
        this.steps = [];
    }

    markAsImportant() {
        this.isImportant = !this.isImportant;
    }

    toggleMyDay() {
        this.isInToday = !this.isInToday;
    }

    toggleCompletion() {
        this.isCompleted = !this.isCompleted;
    }

    addStep(step) {
        this.steps.push(step);
    }

    removeStep(stepId) {
        this.steps = this.steps.filter(step => step.id !== stepId);
    }

    updateTitle(newTitle) {
        if (!newTitle.trim()) throw new Error("Title cannot be empty");
        this.title = newTitle;
    }

    updateDescription(newDescription) {
        this.description = newDescription;
    }

    setDueDate(newDueDate) {
        this.dueDate = newDueDate;
    }

    hasNotes() {
        return this.description.trim() !== "";
    }

    hasSteps() {
        return this.steps.length > 0;
    }
}

// List Class

class List {
    constructor(id, name, isDefault = false) {
        this.id = id;
        this.name = name;
        this.isDefault = isDefault;
        this.tasks = [];
    }

    addTask(task) {
        this.tasks.push(task);
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    getTasks() {
        return [...this.tasks];
    }
}

// Data Manager Class 

class DataManager {
    constructor() {
        this.storage = new StorageManager();
        this.loadFromStorage();
    }

    createTutorialList() {
        const tutorialList = this.createList("Getting Started");
        
        // Create tutorial tasks
        const tasks = [
            {
                title: "👋 Welcome to TaskFlow!",
                description: "This is your first task. Click on it to open the task details panel. Try marking it as complete using the checkbox!",
            },
            {
                title: "⭐ Try marking tasks as Important",
                description: "Click the star icon to mark a task as important. Important tasks appear in your Important list.",
                isImportant: true
            },
            {
                title: "📝 Add steps to break down your tasks",
                description: "Open this task and try adding steps. Steps help you track progress on complex tasks.",
                steps: ["Click on the task", "Click 'Add Step'", "Type your step", "Press Enter"]
            },
            {
                title: "📅 Set due dates for better planning",
                description: "Tasks with due dates appear in your Planned list. Try adding a due date to this task!",
                dueDate: this.getTomorrowDate()
            },
            {
                title: "✨ Create your first task",
                description: "Click the 'Add Task' button at the bottom of any list to create your own task.",
            }
        ];

        // Add each task to the tutorial list
        tasks.forEach(taskData => {
            const task = new Task(
                this.generateId(),
                taskData.title,
                taskData.description,
                taskData.dueDate || null,
                taskData.isImportant || false
            );

            // Add steps if present
            if (taskData.steps) {
                taskData.steps.forEach(stepName => {
                    const step = new Step(this.generateId(), stepName);
                    task.addStep(step);
                });
            }

            // Add to appropriate lists
            this.addTaskToList(tutorialList.id, task);
            
            // Handle special properties
            if (taskData.isImportant) {
                this.getListByName("Important").addTask(task);
            }
            if (taskData.dueDate) {
                this.getListByName("Planned").addTask(task);
            }
        });

        return tutorialList;
    }

    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.toISOString().split('T')[0];
    }

    loadFromStorage() {
        const savedData = this.storage.loadData();
        if (savedData && savedData.lists && savedData.lists.length > 0) {
            // Existing code for loading saved data
            const tasksMap = new Map();

            // First, create all tasks
            savedData.lists.forEach(listData => {
                listData.tasks.forEach(taskData => {
                    if (!tasksMap.has(taskData.id)) {
                        const task = new Task(
                            taskData.id,
                            taskData.title,
                            taskData.description,
                            taskData.dueDate,
                            taskData.isImportant
                        );
                        task.isInToday = taskData.isInToday;
                        task.isCompleted = taskData.isCompleted;
                        task.steps = taskData.steps.map(stepData => {
                            const step = new Step(stepData.id, stepData.name);
                            step.isCompleted = stepData.isCompleted;
                            return step;
                        });
                        tasksMap.set(taskData.id, task);
                    }
                });
            });

            // Create lists and assign tasks
            this.lists = savedData.lists.map(listData => {
                const list = new List(listData.id, listData.name, listData.isDefault);
                list.tasks = listData.tasks.map(taskData => tasksMap.get(taskData.id));
                return list;
            });

            // Restore special lists properly
            const importantList = this.getListByName("Important");
            const todayList = this.getListByName("Today");
            const plannedList = this.getListByName("Planned");

            Array.from(tasksMap.values()).forEach(task => {
                if (task.isImportant && !importantList.tasks.includes(task)) {
                    importantList.addTask(task);
                }
                if (task.isInToday && !todayList.tasks.includes(task)) {
                    todayList.addTask(task);
                }
                if (task.dueDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const taskDueDate = new Date(task.dueDate);
                    taskDueDate.setHours(0, 0, 0, 0);
                    if (taskDueDate > today && !plannedList.tasks.includes(task)) {
                        plannedList.addTask(task);
                    }
                }
            });

            this.currentListId = savedData.currentListId;

            this.cleanupOutdatedTasks();
            this.setupPeriodicCleanup();
        } else {
            // Initialize default lists
            this.lists = [
                new List(this.generateId(), "Tasks", true),
                new List(this.generateId(), "Today", true),
                new List(this.generateId(), "Important", true),
                new List(this.generateId(), "Planned", true)
            ];
            
            // Create and add tutorial list
            const tutorialList = this.createTutorialList();
            this.currentListId = tutorialList.id; // Set tutorial list as initial list
            
            // Save initial state to storage
            this.saveToStorage();

            this.setupPeriodicCleanup();
        }
    }

    saveToStorage() {
        const dataToSave = {
            lists: this.lists,
            currentListId: this.currentListId
        };
        this.storage.saveData(dataToSave);
    }

    setCurrentList(listId) { 
        this.currentListId = listId;
    }

    createList(name, isDefault = false) {
        const newList = new List(this.generateId(), name, isDefault);
        this.lists.push(newList);
        this.saveToStorage();
        return newList;
    }

    deleteList(listId) {
        this.lists = this.lists.filter(list => list.id !== listId);
        
        // If we deleted the current list
        if (this.currentListId === listId) {
            // Find the default "Tasks" list
            const taskslist = this.lists.find(list => list.name === "Tasks");
            this.currentListId = taskslist.id;
        }
        this.saveToStorage();
    }

    getListById(listId) {
        return this.lists.find(list => list.id === listId);
    }

    getListByName(name) { 
        return this.lists.find(list => list.name.toLowerCase().trim() === name.toLowerCase().trim());
    }

    createTask(listId, title, description = "", dueDate = null, isImportant = false) {
        const currentList = this.getListById(listId);
        
        // Create task with default properties
        const task = new Task(this.generateId(), title, description, dueDate, isImportant);
        
        // Set special properties based on the list type
        if (currentList.name === "Today") {
            task.isInToday = true;
        } else if (currentList.name === "Important") {
            task.isImportant = true;
        }
        
        // Only add to Tasks list if it's a default list (except Tasks list itself)
        if (currentList.isDefault && currentList.name !== "Tasks") {
            const tasksList = this.getListByName("Tasks");
            tasksList.addTask(task);
        }

        // Add to current list
        currentList.addTask(task);

        // Handle special lists based on properties
        if (task.isImportant && currentList.name !== "Important") {
            this.getListByName("Important").addTask(task);
        }

        if (task.isInToday && currentList.name !== "Today") {
            this.getListByName("Today").addTask(task);
        }

        // Handle Planned list
        if (dueDate && currentList.name !== "Planned") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDueDate = new Date(dueDate);
            taskDueDate.setHours(0, 0, 0, 0);

            // If due date is today, only add to Today list
            if (taskDueDate.getTime() === today.getTime()) {
                task.isInToday = true;
                if (!this.getListByName("Today").tasks.includes(task)) {
                    this.getListByName("Today").addTask(task);
                }
            }
            // If due date is in the future, add to Planned list
            else if (taskDueDate > today) {
                this.getListByName("Planned").addTask(task);
            }
        }
        // Special handling for tasks created directly in Planned list
        else if (currentList.name === "Planned" && dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDueDate = new Date(dueDate);
            taskDueDate.setHours(0, 0, 0, 0);

            if (taskDueDate.getTime() === today.getTime()) {
                // If due date is today, move to Today list instead
                task.isInToday = true;
                this.getListByName("Today").addTask(task);
                // Remove from Planned list
                currentList.removeTask(task.id);
            }
            // Keep in Planned only if due date is future
            else if (taskDueDate <= today) {
                // If date is past/today, don't add to Planned
                currentList.removeTask(task.id);
            }
        }

        this.saveToStorage();
        return task;
    }

    addTaskToList(listId, task) {
        const list = this.getListById(listId);
        if (list) list.addTask(task);
    }

    removeTaskFromList(listId, taskId) {
        const list = this.getListById(listId);
        if (list) list.removeTask(taskId);
    }

    getTasksByFilter(filterFn) {
        const uniqueTasks = new Set(); // To avoid duplicate counting
        this.lists
            .filter(list => list.isDefault) // Only check default lists
            .forEach(list => {
                list.tasks.forEach(task => {
                    if (filterFn(task)) {
                        uniqueTasks.add(task); // Ensures uniqueness
                    }
                });
            });
        return Array.from(uniqueTasks);
    }

    getTasksSortedByDate() {
        const tasksList = this.getListByName("Tasks");
        return tasksList.tasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    getTaskCounts() {
        const taskCounts = {};
        const countedTasks = new Set(); // Track unique tasks

        // First handle default lists
        const defaultLists = this.lists.filter(list => list.isDefault);
        defaultLists.forEach(list => {
            let taskCount = 0;
            switch (list.name.toLowerCase()) {
                case "tasks":
                    taskCount = list.tasks.filter(task => !task.isCompleted).length;
                    list.tasks.forEach(task => countedTasks.add(task.id));
                    break;
                case "today":
                    taskCount = list.tasks.filter(task => task.isInToday && !task.isCompleted).length;
                    list.tasks.filter(task => task.isInToday).forEach(task => countedTasks.add(task.id));
                    break;
                case "important":
                    taskCount = list.tasks.filter(task => task.isImportant && !task.isCompleted).length;
                    list.tasks.filter(task => task.isImportant).forEach(task => countedTasks.add(task.id));
                    break;
                case "planned":
                    taskCount = list.tasks.filter(task => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const taskDueDate = task.dueDate && new Date(task.dueDate);
                        if (taskDueDate) taskDueDate.setHours(0, 0, 0, 0);
                        return taskDueDate && 
                            taskDueDate.getTime() !== today.getTime() && 
                            !task.isCompleted;
                    }).length;
                    break;
            }
            taskCounts[list.id] = taskCount;
        });

        // Then handle custom lists
        const customLists = this.lists.filter(list => !list.isDefault);
        customLists.forEach(list => {
            taskCounts[list.id] = list.tasks.filter(task => 
                !task.isCompleted
            ).length;
        });

        return taskCounts;
    }

    getTaskById(taskId) {
        for (const list of this.lists) {
            const task = list.tasks.find(task => task.id === taskId);
            if (task) {
                return task;
            }
        }
        return null; // Return null if the task is not found
    }

    addStepToTask(taskId, stepName) {
        const task = this.getTaskById(taskId);
        if (task) {
            const step = new Step(this.generateId(), stepName);
            task.addStep(step);
            this.saveToStorage();
            return step;
        }
        return null;
    }

    toggleStepCompletion(taskId, stepId) {
        const task = this.getTaskById(taskId);
        if (task) {
            const step = task.steps.find(step => step.id === stepId);
            if (step) {
                step.toggleCompletion();
                this.saveToStorage();
            }
        }
    }

    deleteTask(taskId) {
        // Remove task from all lists
        this.lists.forEach(list => {
            list.removeTask(taskId);
        });
        // Save changes to storage
        this.saveToStorage();
    }

    generateId() {
        return Date.now() + Math.random().toString(16).slice(2);
    }

    cleanupOutdatedTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let needsUIUpdate = false;

        // Clean up Today list
        const todayList = this.getListByName("Today");
        const plannedList = this.getListByName("Planned");

        // Store initial lengths
        const todayTasksBefore = todayList.tasks.length;
        const plannedTasksBefore = plannedList.tasks.length;

        // Clean Today list - remove all tasks at midnight
        todayList.tasks.forEach(task => {
            task.isInToday = false; // Reset the flag for all tasks
        });
        todayList.tasks = []; // Clear the today list

        // Clean Planned list - remove tasks with past due dates
        plannedList.tasks = plannedList.tasks.filter(task => {
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today; // Keep only future tasks
        });

        // Check if any changes were made
        if (todayTasksBefore > 0 || plannedTasksBefore !== plannedList.tasks.length) {
            needsUIUpdate = true;
        }

        this.saveToStorage();
        return needsUIUpdate;
    }

    setupPeriodicCleanup() {
        const performCleanup = () => {
            const needsUIUpdate = this.cleanupOutdatedTasks();
            if (needsUIUpdate && this.uiInstance) {
                this.uiInstance.renderTasks();
                this.uiInstance.renderSidebar();
            }
        };

        // Perform initial cleanup when app starts
        performCleanup();

        // Set up next midnight check
        const setNextMidnightCheck = () => {
            const now = new Date();
            const tomorrow = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 0, 0
            );
            const msUntilMidnight = tomorrow - now;

            setTimeout(() => {
                performCleanup();
                setNextMidnightCheck(); // Setup next day's check
            }, msUntilMidnight);
        };

        // Start the midnight check cycle
        setNextMidnightCheck();
    }

    // Add method to set UI reference
    setUIInstance(ui) {
        this.uiInstance = ui;
    }
}

export { Step, Task, List, DataManager };