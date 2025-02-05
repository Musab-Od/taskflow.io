class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'taskflow_data';
    }

    saveData(data) {
        try {
            // Collect all unique tasks and ensure their properties are consistent
            const uniqueTasks = new Map();
            data.lists.forEach(list => {
                list.tasks.forEach(task => {
                    if (!uniqueTasks.has(task.id)) {
                        uniqueTasks.set(task.id, {
                            id: task.id,
                            title: task.title,
                            description: task.description,
                            dueDate: task.dueDate,
                            isImportant: task.isImportant,
                            isInToday: task.isInToday,
                            isCompleted: task.isCompleted,
                            steps: task.steps
                        });
                    }
                });
            });

            // Create cleaned data structure with task references
            const cleanData = {
                tasks: Array.from(uniqueTasks.values()),
                lists: data.lists.map(list => ({
                    id: list.id,
                    name: list.name,
                    isDefault: list.isDefault,
                    taskIds: list.tasks.map(task => task.id)
                })),
                currentListId: data.currentListId
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanData));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;

            const parsedData = JSON.parse(data);
            const tasksMap = new Map();

            // First create all task instances
            parsedData.tasks.forEach(taskData => {
                const task = {
                    id: taskData.id,
                    title: taskData.title,
                    description: taskData.description,
                    dueDate: taskData.dueDate,
                    isImportant: taskData.isImportant,
                    isInToday: taskData.isInToday,
                    isCompleted: taskData.isCompleted,
                    steps: taskData.steps
                };
                tasksMap.set(task.id, task);
            });

            // Then reconstruct lists with references to tasks
            return {
                lists: parsedData.lists.map(listData => ({
                    id: listData.id,
                    name: listData.name,
                    isDefault: listData.isDefault,
                    tasks: listData.taskIds.map(taskId => tasksMap.get(taskId))
                })),
                currentListId: parsedData.currentListId
            };
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    clearData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}

export { StorageManager };
