class Header {
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
