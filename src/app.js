import "./CSS/normalize.css";
import "./CSS/all.min.css";
import "./CSS/style.css";
import { DataManager } from "./data.js";
import { UI } from "./UI.js";

const dataManager = new DataManager();
const ui = new UI(dataManager);

// Toggle dark mode
document.getElementById("dark-mode-toggle").addEventListener("click", () => {
    ui.toggleDarkMode();
});

// Add list Button
document.getElementById("add-list").addEventListener("click", () => ui.handleAddList());

// List click event
document.querySelector(".sidebar").addEventListener("click", (e) => {
    const listElement = e.target.closest(".sidebar-button");
    if (!listElement) return;
    ui.handleListClick(listElement);
});

// Add task Button
document.getElementById("add-task").addEventListener("click", () => ui.handleAddTask());

// Toggle completed tasks
document.getElementById("toggle-completed").addEventListener("click", () => ui.toggleCompletedTasks());

// Add mobile back navigation
document.querySelector('.previous-arrow').addEventListener('click', () => {
    ui.handleBackNavigation();
});

// Initial render and set default list
ui.renderSidebar();
const gettingStartedList = document.querySelector('.sidebar-custom-lists .sidebar-button');
const defaultListButton = document.getElementById("tasks");
if (gettingStartedList) {
    ui.handleListClick(gettingStartedList);
} else if (defaultListButton) {
    ui.handleListClick(defaultListButton);
}