class Header {

    constructor() {
        this.DARK_MODE_KEY = 'taskflow_dark_Mode';
    }

    toggleDarkMode(currentList) {
        const body = document.body;
        const isDarkMode = body.classList.toggle("dark");
        const toggleButton = document.getElementById("dark-mode-toggle");
        const ball = document.getElementById("ball");
        const icon = document.getElementById("icon");

        // Remove any existing list-specific classes
        toggleButton.classList.remove("important", "planned");
        ball.classList.remove("important", "planned");

        // Add dark mode classes
        toggleButton.classList.toggle("dark", isDarkMode);
        ball.classList.toggle("dark", isDarkMode);

        // Add list-specific classes
        if (currentList) {
            const listName = currentList.name.toLowerCase();
            if (listName === 'important' || listName === 'planned') {
                toggleButton.classList.add(listName);
                ball.classList.add(listName);
            }
        }

        // Update icon
        if (isDarkMode) {
            icon.classList.remove("fa-sun");
            icon.classList.add("fa-moon");
        } else {
            icon.classList.remove("fa-moon");
            icon.classList.add("fa-sun");
        }

        this.saveDarkModeState(isDarkMode);
    }

    saveDarkModeState(isDarkMode) {
        try {
            localStorage.setItem(this.DARK_MODE_KEY, JSON.stringify(isDarkMode));
        } catch (error) {
            console.error('Error saving dark mode state:', error);
        }
    }

    loadDarkModeState() {
        try {
            const darkModeState = localStorage.getItem(this.DARK_MODE_KEY);
            if (darkModeState !== null) {
                const isDarkMode = JSON.parse(darkModeState);
                const body = document.body;
                const toggleButton = document.getElementById("dark-mode-toggle");
                const ball = document.getElementById("ball");
                const icon = document.getElementById("icon");

                if (isDarkMode) {
                    body.classList.add("dark");
                    toggleButton.classList.add("dark");
                    ball.classList.add("dark");
                    icon.classList.remove("fa-sun");
                    icon.classList.add("fa-moon");
                } else {
                    body.classList.remove("dark");
                    toggleButton.classList.remove("dark");
                    ball.classList.remove("dark");
                    icon.classList.remove("fa-moon");
                    icon.classList.add("fa-sun");
                }
            }
        } catch (error) {
            console.error('Error loading dark mode state from localStorage:', error);
        }
    }

    updateToggleStyle(currentList) {
        const toggleButton = document.getElementById("dark-mode-toggle");
        const ball = document.getElementById("ball");

        // Remove any existing list-specific classes
        toggleButton.classList.remove("important", "planned");
        ball.classList.remove("important", "planned");

        // Add list-specific classes
        if (currentList) {
            const listName = currentList.name.toLowerCase();
            if (listName === 'important' || listName === 'planned') {
                toggleButton.classList.add(listName);
                ball.classList.add(listName);
            }
        }
    }
}

export { Header };
