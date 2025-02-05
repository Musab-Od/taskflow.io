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

loadFromStorage() {
    const savedData = this.storage.loadData();
    if (savedData) {
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
            const originalList = this.lists.find(list => list.tasks.includes(task));

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
    } else {
        // Initialize default lists
        this.lists = [
            new List(this.generateId(), "Tasks", true),
            new List(this.generateId(), "Today", true),
            new List(this.generateId(), "Important", true),
            new List(this.generateId(), "Planned", true)
        ];
        this.currentListId = this.lists[0].id;
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
        const task = new Task(this.generateId(), title, description, dueDate, isImportant);
        const currentList = this.getListById(listId);
        
        // Only add to Tasks list if it's a default list
        if (currentList.isDefault) {
            const tasksList = this.getListByName("Tasks");
            if (listId !== tasksList.id) {
                tasksList.addTask(task);
            }
        }

        // Add to current list
        this.addTaskToList(listId, task);
    
        // Handle special properties
        if (dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDueDate = new Date(dueDate);
            taskDueDate.setHours(0, 0, 0, 0);

            if (taskDueDate.getTime() === today.getTime()) {
                task.isInToday = true;
                this.getListByName("Today").addTask(task);
            } else if (taskDueDate > today) {
                this.getListByName("Planned").addTask(task);
            }
        }

        if (isImportant) {
            task.isImportant = true;
            this.getListByName("Important").addTask(task);
        }

        this.saveToStorage();
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
}

export { Step, Task, List, DataManager };