// To-Do List Application JavaScript

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.taskIdCounter = 1;
        
        // DOM elements
        this.taskInput = document.getElementById('taskInput');
        this.taskDate = document.getElementById('taskDate');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.pendingTasks = document.getElementById('pendingTasks');
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.setDefaultDate();
        this.render();
        this.updateStats();
    }
    
    setDefaultDate() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        this.taskDate.value = today;
    }
    
    bindEvents() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        this.taskDate.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Clear completed tasks
        this.clearCompleted.addEventListener('click', () => {
            this.clearCompletedTasks();
        });
        
        // Export tasks
        this.exportBtn.addEventListener('click', () => {
            this.exportTasks();
        });
        
        // Import tasks
        this.importBtn.addEventListener('click', () => {
            this.importFile.click();
        });
        
        this.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importTasks(file);
            }
            // Reset file input
            e.target.value = '';
        });
        
        // Prevent form submission if Enter is pressed
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
        
        this.taskDate.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
    
    addTask() {
        const taskText = this.taskInput.value.trim();
        const taskDate = this.taskDate.value;
        
        if (taskText === '') {
            this.showNotification('Please enter a task!', 'error');
            this.taskInput.focus();
            return;
        }
        
        if (!taskDate) {
            this.showNotification('Please select a date!', 'error');
            this.taskDate.focus();
            return;
        }
        
        if (taskText.length > 100) {
            this.showNotification('Task is too long! Maximum 100 characters.', 'error');
            return;
        }
        
        // Check for duplicate tasks
        const isDuplicate = this.tasks.some(task => 
            task.text.toLowerCase() === taskText.toLowerCase()
        );
        
        if (isDuplicate) {
            this.showNotification('This task already exists!', 'warning');
            return;
        }
        
        // Format the selected date
        const selectedDate = new Date(taskDate);
        const formattedDate = selectedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const newTask = {
            id: this.taskIdCounter++,
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            taskDate: taskDate,
            formattedTaskDate: formattedDate,
            completedAt: null
        };
        
        this.tasks.unshift(newTask); // Add to beginning of array
        this.taskInput.value = '';
        this.setDefaultDate(); // Reset date to today
        this.saveToStorage();
        this.render();
        this.updateStats();
        this.showNotification('Task added successfully!', 'success');
        
        // Focus back to input for quick task addition
        this.taskInput.focus();
    }
    
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            
            this.saveToStorage();
            this.render();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as pending!';
            this.showNotification(message, 'success');
        }
    }
    
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToStorage();
            this.render();
            this.updateStats();
            this.showNotification('Task deleted!', 'success');
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter button states
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.render();
    }
    
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'warning');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveToStorage();
            this.render();
            this.updateStats();
            this.showNotification(`${completedCount} completed task(s) deleted!`, 'success');
        }
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return this.tasks;
        }
    }
    
    render() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
            
            // Update empty state message based on filter
            const emptyMessages = {
                all: 'No tasks yet. Add one above!',
                completed: 'No completed tasks yet.',
                pending: 'No pending tasks. Great job!'
            };
            this.emptyState.querySelector('p').textContent = emptyMessages[this.currentFilter];
        } else {
            this.taskList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            
            // Add event listeners to new task elements
            this.bindTaskEvents();
        }
    }
    
    createTaskHTML(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '';
        const taskDate = task.formattedTaskDate || (task.taskDate ? new Date(task.taskDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '');
        
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text" title="Created: ${createdDate}${completedDate ? ` | Completed: ${completedDate}` : ''}">${this.escapeHtml(task.text)}</span>
                    ${taskDate ? `<span class="task-date">📅 ${taskDate}</span>` : ''}
                </div>
                <div class="task-actions">
                    <button class="delete-btn" title="Delete task">Delete</button>
                </div>
            </li>
        `;
    }
    
    bindTaskEvents() {
        // Checkbox events
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                this.toggleTask(taskId);
            });
        });
        
        // Delete button events
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                this.deleteTask(taskId);
            });
        });
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        this.totalTasks.textContent = `Total: ${total}`;
        this.completedTasks.textContent = `Completed: ${completed}`;
        this.pendingTasks.textContent = `Pending: ${pending}`;
        
        // Enable/disable clear completed button
        this.clearCompleted.disabled = completed === 0;
    }
    
    saveToStorage() {
        try {
            const dataToSave = {
                tasks: this.tasks,
                taskIdCounter: this.taskIdCounter,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('todoApp', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Error saving data!', 'error');
        }
    }
    
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('todoApp');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.tasks = data.tasks || [];
                this.taskIdCounter = data.taskIdCounter || 1;
                
                // Ensure taskIdCounter is higher than any existing task ID
                if (this.tasks.length > 0) {
                    const maxId = Math.max(...this.tasks.map(task => task.id));
                    this.taskIdCounter = Math.max(this.taskIdCounter, maxId + 1);
                }
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.showNotification('Error loading saved data!', 'error');
            this.tasks = [];
            this.taskIdCounter = 1;
        }
    }
    
    showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add notification styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Export/Import functionality
    exportTasks() {
        const dataToExport = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!', 'success');
    }
    
    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.tasks && Array.isArray(data.tasks)) {
                    // Ask user if they want to replace or merge tasks
                    const shouldReplace = confirm('Do you want to replace all current tasks with imported tasks?\nClick "OK" to replace, "Cancel" to merge with existing tasks.');
                    
                    if (shouldReplace) {
                        this.tasks = data.tasks;
                    } else {
                        // Merge tasks, avoiding duplicates
                        const existingTexts = this.tasks.map(task => task.text.toLowerCase());
                        const newTasks = data.tasks.filter(task => 
                            !existingTexts.includes(task.text.toLowerCase())
                        );
                        
                        // Update IDs for new tasks to avoid conflicts
                        newTasks.forEach(task => {
                            task.id = this.taskIdCounter++;
                        });
                        
                        this.tasks = [...this.tasks, ...newTasks];
                    }
                    
                    // Ensure taskIdCounter is higher than any existing task ID
                    if (this.tasks.length > 0) {
                        const maxId = Math.max(...this.tasks.map(task => task.id));
                        this.taskIdCounter = Math.max(this.taskIdCounter, maxId + 1);
                    }
                    
                    this.saveToStorage();
                    this.render();
                    this.updateStats();
                    
                    const importedCount = shouldReplace ? data.tasks.length : data.tasks.filter(task => 
                        !this.tasks.some(existing => existing.text.toLowerCase() === task.text.toLowerCase())
                    ).length;
                    
                    this.showNotification(`${importedCount} task(s) imported successfully!`, 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Error importing tasks: Invalid file format!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
    
    // Make app globally available for debugging
    window.todoApp = app;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add task
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            app.addTask();
            e.preventDefault();
        }
        
        // Escape to clear input
        if (e.key === 'Escape' && (document.activeElement === app.taskInput || document.activeElement === app.taskDate)) {
            app.taskInput.value = '';
            app.setDefaultDate();
            app.taskInput.focus();
        }
    });
    
    // Handle page visibility change to sync data
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page became visible, reload data from storage
            app.loadFromStorage();
            app.render();
            app.updateStats();
        }
    });
    
    // Handle beforeunload to ensure data is saved
    window.addEventListener('beforeunload', () => {
        app.saveToStorage();
    });
    
    console.log('To-Do List App initialized successfully!');
});