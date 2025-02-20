import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { TaskList } from './TaskList';
import { TaskOptions } from './TaskOptions';

class UI {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.header = new Header();
        this.sidebar = new Sidebar(dataManager, this);
        this.taskList = new TaskList(dataManager, this);
        this.taskList.setupContextMenu();
        this.taskOptions = new TaskOptions(dataManager, this);
        this.isMobile = window.innerWidth < 768;
        this.currentMobileView = 'lists'; // 'lists', 'tasks', 'options'
        this.setupMobileDetection();
        this.previousView = null;

        this.header.loadDarkModeState();
    }

    static CLASS_NAMES = {
        TASKS: "tasks",
        TODAY: "today",
        IMPORTANT: "important",
        PLANNED: "planned",
        LIST: "list"
    };

    setupMobileDetection() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            if (wasMobile !== this.isMobile) {
                this.handleLayoutChange();
            }
        });
    }

    handleLayoutChange() {
        const pageLayout = document.querySelector('.page-layout');
        if (this.isMobile) {
            pageLayout.classList.add('mobile');
            this.showMobileView('lists');
        } else {
            pageLayout.classList.remove('mobile');
            document.querySelector('.sidebar').classList.remove('hidden');
            document.getElementById('main').classList.remove('hidden');
            document.querySelector('.option').classList.add('hidden');
        }
    }

    showMobileView(view) {
        this.previousView = this.currentMobileView;
        this.currentMobileView = view;
        
        const sidebar = document.querySelector('.sidebar');
        const main = document.getElementById('main');
        const option = document.querySelector('.option');
        const previousArrow = document.querySelector('.previous-arrow');
        const previousText = previousArrow.querySelector('span');

        // Update previous arrow text
        if (view === 'tasks') {
            previousText.textContent = 'Lists';
        } else if (view === 'options') {
            const currentList = this.dataManager.getListById(this.dataManager.currentListId);
            previousText.textContent = currentList.name;
        }

        sidebar.classList.toggle('hidden', view !== 'lists');
        main.classList.toggle('hidden', view !== 'tasks');
        option.classList.toggle('hidden', view !== 'options');
        
        // Show/hide previous arrow
        previousArrow.classList.toggle('hidden', view === 'lists');
    }

    handleBackNavigation() {
        if (this.currentMobileView === 'options') {
            this.showMobileView('tasks');
        } else if (this.currentMobileView === 'tasks') {
            this.showMobileView('lists');
        }
    }

    addBackButton() {
        const backButton = document.createElement('button');
        backButton.className = 'mobile-back';
        backButton.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
        backButton.addEventListener('click', () => {
            const previousView = this.currentMobileView === 'options' ? 'tasks' : 'lists';
            this.showMobileView(previousView);
        });

        const container = this.currentMobileView === 'options' 
            ? document.querySelector('.option-exit-button')
            : document.querySelector('.title');
        container.prepend(backButton);
    }

    // Sidebar Functions
    renderSidebar() {
        this.sidebar.renderSidebar();
    }

    handleListClick(listElement) {
        if (this.isMobile) {
            this.showMobileView('tasks');
        }
        this.sidebar.handleListClick(listElement);
        const listId = listElement.dataset.id;
        const currentList = this.dataManager.getListById(listId);
        this.header.updateToggleStyle(currentList);
    }

    handleAddList() {
        this.sidebar.handleAddList();
    }

    // Main Functions
    updateMainSection(currentList) {
        this.taskList.updateMainSection(currentList);
    }

    getTodayTitle() {
        return this.taskList.getTodayTitle();
    }

    getTaskListNames(task) {
        return this.taskList.getTaskListNames(task);
    }

    handleTaskCompletion(taskId) {
        this.taskList.handleTaskCompletion(taskId);
    }

    handleTaskImportant(taskId) {
        this.taskList.handleTaskImportant(taskId);
    }

    toggleCompletedTasks() {
        this.taskList.toggleCompletedTasks();
    }

    handleAddTask() {
        this.taskList.handleAddTask();
    }

    renderTasks() {
        this.taskList.renderTasks();
    }

    updateTaskDetailsInDOM(task) {
        this.taskList.updateTaskDetailsInDOM(task);
    }

    getTaskDetailsHTML(task) {
        return this.taskList.getTaskDetailsHTML(task);
    }

    renderOptions(task) {
        if (this.isMobile) {
            this.showMobileView('options');
        }
        this.taskOptions.renderOptions(task);
    }

    setupOptionEvents(task) {
        this.taskOptions.setupOptionEvents(task);
    }

    setupCloseOptionEvent() {
        this.taskOptions.setupCloseOptionEvent();
    }

    setupMarkImportantEvent(task) {
        this.taskOptions.setupMarkImportantEvent(task);
    }

    setupAddStepEvent(task) {
        this.taskOptions.setupAddStepEvent(task);
    }

    setupAddToMyDayEvent(task) {
        this.taskOptions.setupAddToMyDayEvent(task);
    }

    setupTaskNotesEvent(task) {
        this.taskOptions.setupTaskNotesEvent(task);
    }

    setupDeleteTaskEvent(task) {
        this.taskOptions.setupDeleteTaskEvent(task);
    }

    // Header Functions
    toggleDarkMode() {
        const currentList = this.dataManager.getListById(this.dataManager.currentListId);
        this.header.toggleDarkMode(currentList);
    }
}

export { UI };