// Admin interface for managing Complex Systems Seminar schedule via GitHub API
// Handles authentication, file loading, editing, and saving

class AdminManager {
    constructor() {
        this.githubToken = null;
        this.repoOwner = null;
        this.repoName = null;
        this.currentFile = null;
        this.currentFileSha = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredCredentials();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('connect-btn').addEventListener('click', () => this.connectToRepo());
        
        // File operations
        document.getElementById('file-select').addEventListener('change', (e) => {
            const loadBtn = document.getElementById('load-file-btn');
            const validateBtn = document.getElementById('validate-btn');
            
            if (e.target.value) {
                loadBtn.disabled = false;
                validateBtn.disabled = false;
            } else {
                loadBtn.disabled = true;
                validateBtn.disabled = true;
            }
        });
        
        document.getElementById('load-file-btn').addEventListener('click', () => this.loadFile());
        document.getElementById('validate-btn').addEventListener('click', () => this.validateJSON());
        document.getElementById('format-btn').addEventListener('click', () => this.formatJSON());
        document.getElementById('save-btn').addEventListener('click', () => this.saveFile());
        
        // Restore file upload
        document.getElementById('restore-file').addEventListener('change', (e) => this.handleFileRestore(e));
        
        // Auto-save credentials
        ['github-token', 'repo-owner', 'repo-name'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.saveCredentials());
        });
        
        // JSON editor changes
        document.getElementById('json-editor').addEventListener('input', () => {
            document.getElementById('save-btn').disabled = false;
        });
    }

    loadStoredCredentials() {
        // Load from sessionStorage (not localStorage for security)
        const token = sessionStorage.getItem('github-token');
        const owner = sessionStorage.getItem('repo-owner');
        const name = sessionStorage.getItem('repo-name');
        
        if (token) document.getElementById('github-token').value = token;
        if (owner) document.getElementById('repo-owner').value = owner;
        if (name) document.getElementById('repo-name').value = name;
    }

    saveCredentials() {
        // Save to sessionStorage only
        sessionStorage.setItem('github-token', document.getElementById('github-token').value);
        sessionStorage.setItem('repo-owner', document.getElementById('repo-owner').value);
        sessionStorage.setItem('repo-name', document.getElementById('repo-name').value);
    }

    async connectToRepo() {
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('repo-owner').value.trim();
        const name = document.getElementById('repo-name').value.trim();

        if (!token || !owner || !name) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.showMessage('Connecting to repository...', 'info');

        try {
            // Test connection by fetching repo info
            const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
            }

            const repoData = await response.json();
            
            this.githubToken = token;
            this.repoOwner = owner;
            this.repoName = name;

            this.showMessage(`Connected to ${repoData.full_name}`, 'success');
            
            // Show editor section
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('editor-section').classList.remove('hidden');

        } catch (error) {
            console.error('Connection error:', error);
            this.showMessage(`Connection failed: ${error.message}`, 'error');
        }
    }

    async loadFile() {
        const filePath = document.getElementById('file-select').value;
        if (!filePath) return;

        this.showMessage('Loading file...', 'info');

        try {
            const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${filePath}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
            }

            const fileData = await response.json();
            const content = atob(fileData.content);

            this.currentFile = filePath;
            this.currentFileSha = fileData.sha;

            // Update file info
            document.getElementById('file-path').textContent = filePath;
            document.getElementById('file-modified').textContent = new Date(fileData.commit?.committer?.date || Date.now()).toLocaleString();
            document.getElementById('file-size').textContent = fileData.size;
            document.getElementById('file-info').classList.remove('hidden');

            // Load content into editor
            document.getElementById('json-editor').value = content;
            document.getElementById('save-btn').disabled = true;

            this.showMessage('File loaded successfully', 'success');
            this.validateJSON();

        } catch (error) {
            console.error('Load error:', error);
            this.showMessage(`Failed to load file: ${error.message}`, 'error');
        }
    }

    validateJSON() {
        const editor = document.getElementById('json-editor');
        const resultDiv = document.getElementById('validation-result');
        
        try {
            const jsonData = JSON.parse(editor.value);
            
            // Additional validation for schedule.json
            if (this.currentFile === 'data/schedule.json') {
                this.validateScheduleData(jsonData);
            }
            
            resultDiv.innerHTML = '<div style="color: var(--accent-success); padding: 1rem; background: rgba(25, 135, 84, 0.1); border-radius: var(--border-radius);">✅ Valid JSON</div>';
            resultDiv.classList.remove('hidden');
            
            return true;
        } catch (error) {
            resultDiv.innerHTML = `<div style="color: var(--accent-danger); padding: 1rem; background: rgba(220, 53, 69, 0.1); border-radius: var(--border-radius);">❌ Invalid JSON: ${error.message}</div>`;
            resultDiv.classList.remove('hidden');
            
            return false;
        }
    }

    validateScheduleData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Schedule data must be an array');
        }

        const requiredFields = ['id', 'title', 'speakers', 'affiliation', 'datetime', 'duration_min', 'level', 'tags', 'abstract'];
        
        data.forEach((event, index) => {
            requiredFields.forEach(field => {
                if (!(field in event)) {
                    throw new Error(`Event ${index}: Missing required field '${field}'`);
                }
            });

            // Validate datetime format
            if (isNaN(Date.parse(event.datetime))) {
                throw new Error(`Event ${index}: Invalid datetime format`);
            }

            // Validate level
            if (!['intro', 'advanced'].includes(event.level)) {
                throw new Error(`Event ${index}: Level must be 'intro' or 'advanced'`);
            }

            // Validate arrays
            if (!Array.isArray(event.speakers)) {
                throw new Error(`Event ${index}: Speakers must be an array`);
            }

            if (!Array.isArray(event.tags)) {
                throw new Error(`Event ${index}: Tags must be an array`);
            }
        });
    }

    formatJSON() {
        const editor = document.getElementById('json-editor');
        
        try {
            const jsonData = JSON.parse(editor.value);
            editor.value = JSON.stringify(jsonData, null, 2);
            this.showMessage('JSON formatted', 'success');
        } catch (error) {
            this.showMessage('Cannot format invalid JSON', 'error');
        }
    }

    async saveFile() {
        if (!this.validateJSON()) {
            this.showMessage('Cannot save invalid JSON', 'error');
            return;
        }

        const commitMessage = document.getElementById('commit-message').value.trim() || 
                             `chore(${this.currentFile.split('/')[1]}): update`;

        this.showMessage('Saving file...', 'info');

        try {
            const content = btoa(document.getElementById('json-editor').value);
            
            const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.currentFile}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: content,
                    sha: this.currentFileSha
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to save: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            this.currentFileSha = result.content.sha;

            document.getElementById('save-btn').disabled = true;
            document.getElementById('commit-message').value = '';

            this.showMessage('File saved successfully', 'success');

        } catch (error) {
            console.error('Save error:', error);
            this.showMessage(`Failed to save: ${error.message}`, 'error');
        }
    }

    handleFileRestore(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                JSON.parse(content); // Validate JSON
                
                document.getElementById('json-editor').value = content;
                document.getElementById('save-btn').disabled = false;
                
                this.showMessage('File restored to editor', 'success');
                this.validateJSON();
            } catch (error) {
                this.showMessage('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('status-messages');
        const messageDiv = document.createElement('div');
        
        const colors = {
            info: 'var(--accent-primary)',
            success: 'var(--accent-success)',
            error: 'var(--accent-danger)',
            warning: 'var(--accent-warning)'
        };

        messageDiv.style.cssText = `
            padding: 1rem;
            margin-bottom: 1rem;
            background-color: ${colors[type]};
            color: white;
            border-radius: var(--border-radius);
            animation: slideIn 0.3s ease-out;
        `;
        
        messageDiv.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        
        container.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }
        }, 5000);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
}

// Quick action functions
function addNewEvent() {
    const template = {
        id: `${new Date().toISOString().split('T')[0]}-new-event`,
        title: "New Event Title",
        speakers: ["Speaker Name"],
        affiliation: "Weizmann Institute of Science",
        datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+02:00",
        duration_min: 120,
        room: "Physics Lec. Room A",
        level: "intro",
        tags: ["new topic"],
        abstract: "Event abstract goes here...",
        references: []
    };

    const editor = document.getElementById('json-editor');
    try {
        const data = JSON.parse(editor.value);
        if (Array.isArray(data)) {
            data.push(template);
            editor.value = JSON.stringify(data, null, 2);
            document.getElementById('save-btn').disabled = false;
            window.adminManager.showMessage('New event template added', 'success');
        }
    } catch (error) {
        window.adminManager.showMessage('Cannot add to invalid JSON', 'error');
    }
}

function sortEventsByDate() {
    const editor = document.getElementById('json-editor');
    try {
        const data = JSON.parse(editor.value);
        if (Array.isArray(data)) {
            data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
            editor.value = JSON.stringify(data, null, 2);
            document.getElementById('save-btn').disabled = false;
            window.adminManager.showMessage('Events sorted by date', 'success');
        }
    } catch (error) {
        window.adminManager.showMessage('Cannot sort invalid JSON', 'error');
    }
}

function validateAllEvents() {
    window.adminManager.validateJSON();
}

function downloadBackup() {
    const editor = document.getElementById('json-editor');
    const content = editor.value;
    
    if (!content.trim()) {
        window.adminManager.showMessage('No content to backup', 'warning');
        return;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${window.adminManager.currentFile?.replace('/', '-') || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    window.adminManager.showMessage('Backup downloaded', 'success');
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    #status-messages {
        max-height: 300px;
        overflow-y: auto;
    }
`;
document.head.appendChild(style);

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
