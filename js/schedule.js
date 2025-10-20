// Schedule page functionality for Complex Systems Seminar website
// Handles event loading, filtering, searching, and calendar integration

class ScheduleManager {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentTimezone = 'Asia/Jerusalem';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadEvents();
        this.renderEvents();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', 
                window.seminarApp.debounce(() => this.filterAndRender(), 300)
            );
        }

        // Filter functionality
        const topicFilter = document.getElementById('topic-filter');
        const levelFilter = document.getElementById('level-filter');
        
        if (topicFilter) {
            topicFilter.addEventListener('change', () => this.filterAndRender());
        }
        
        if (levelFilter) {
            levelFilter.addEventListener('change', () => this.filterAndRender());
        }

        // Timezone toggle
        const timezoneToggle = document.getElementById('timezone-toggle');
        if (timezoneToggle) {
            timezoneToggle.addEventListener('change', (e) => {
                this.currentTimezone = e.target.value === 'local' ? 
                    Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Jerusalem';
                this.renderEvents();
            });
        }
    }

    async loadEvents() {
        try {
            const response = await fetch('data/schedule.json');
            this.events = await response.json();
            this.filteredEvents = [...this.events];
            
            // Hide loading state
            const loadingState = document.getElementById('loading-state');
            if (loadingState) {
                loadingState.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            this.showError('Failed to load schedule. Please try again later.');
        }
    }

    filterAndRender() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const topicFilter = document.getElementById('topic-filter')?.value || '';
        const levelFilter = document.getElementById('level-filter')?.value || '';

        this.filteredEvents = this.events.filter(event => {
            // Search filter
            const matchesSearch = !searchTerm || 
                event.title.toLowerCase().includes(searchTerm) ||
                event.speakers.some(speaker => speaker.toLowerCase().includes(searchTerm)) ||
                event.abstract.toLowerCase().includes(searchTerm) ||
                event.affiliation.toLowerCase().includes(searchTerm);

            // Topic filter
            const matchesTopic = !topicFilter || 
                event.tags.some(tag => tag.toLowerCase().includes(topicFilter.toLowerCase()));

            // Level filter
            const matchesLevel = !levelFilter || event.level === levelFilter;

            return matchesSearch && matchesTopic && matchesLevel;
        });

        this.renderEvents();
    }

    renderEvents() {
        const now = new Date();
        const upcomingEvents = this.filteredEvents
            .filter(event => new Date(event.datetime) > now)
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        const pastEvents = this.filteredEvents
            .filter(event => new Date(event.datetime) <= now)
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        this.renderEventSection('upcoming', upcomingEvents);
        this.renderEventSection('past', pastEvents);

        // Show/hide sections and no results message
        this.toggleSectionVisibility('upcoming-section', upcomingEvents.length > 0);
        this.toggleSectionVisibility('past-section', pastEvents.length > 0);
        this.toggleSectionVisibility('no-results', 
            upcomingEvents.length === 0 && pastEvents.length === 0);
    }

    renderEventSection(type, events) {
        const container = document.getElementById(`${type}-talks`);
        if (!container) return;

        container.innerHTML = '';

        events.forEach(event => {
            const eventCard = this.createEventCard(event, type === 'past');
            container.appendChild(eventCard);
        });
    }

    createEventCard(event, isPast = false) {
        const template = document.getElementById('event-card-template');
        const card = template.content.cloneNode(true);
        
        // Add status class
        const cardElement = card.querySelector('.event-card');
        cardElement.classList.add(isPast ? 'status-past' : 'status-upcoming');

        // Set datetime
        const eventDate = new Date(event.datetime);
        const timeElement = card.querySelector('.event-time');
        timeElement.textContent = window.seminarApp.formatDateTime(eventDate, this.currentTimezone);
        timeElement.setAttribute('datetime', event.datetime);

        // Set title
        card.querySelector('.event-title').textContent = event.title;

        // Set speakers
        card.querySelector('.event-speakers span').textContent = event.speakers.join(', ');

        // Set affiliation
        card.querySelector('.event-affiliation span').textContent = event.affiliation;

        // Set duration
        card.querySelector('.event-duration').textContent = 
            window.seminarApp.formatDuration(event.duration_min);

        // Set room
        card.querySelector('.event-room span').textContent = 
            event.room || window.seminarApp.settings.default_room;

        // Set tags
        const tagsContainer = card.querySelector('.event-tags');
        tagsContainer.innerHTML = '';
        
        // Add level tag
        const levelTag = document.createElement('span');
        levelTag.className = `tag level-${event.level}`;
        levelTag.textContent = event.level === 'intro' ? 'Introductory' : 'Advanced';
        tagsContainer.appendChild(levelTag);

        // Add topic tags
        event.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });

        // Set abstract
        const abstractElement = card.querySelector('.abstract-text');
        abstractElement.textContent = event.abstract;
        
        const toggleButton = card.querySelector('.toggle-abstract');
        const abstractContainer = card.querySelector('.event-abstract');
        
        // Check if abstract is long enough to need collapsing
        if (event.abstract.length > 200) {
            abstractContainer.classList.add('collapsed');
            toggleButton.addEventListener('click', () => {
                const isCollapsed = abstractContainer.classList.contains('collapsed');
                abstractContainer.classList.toggle('collapsed');
                toggleButton.textContent = isCollapsed ? 'Show Less' : 'Show More';
                toggleButton.setAttribute('aria-expanded', isCollapsed);
            });
        } else {
            toggleButton.style.display = 'none';
        }

        // Set references
        if (event.references && event.references.length > 0) {
            const referencesContainer = card.querySelector('.event-references');
            const referencesList = card.querySelector('.references-list');
            
            referencesList.innerHTML = '';
            event.references.forEach(ref => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = ref.url;
                link.textContent = ref.label;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                li.appendChild(link);
                referencesList.appendChild(li);
            });
            
            referencesContainer.classList.remove('hidden');
        }

        // Set up action buttons
        this.setupEventActions(card, event, isPast);

        return card;
    }

    setupEventActions(card, event, isPast) {
        const addToCalendarBtn = card.querySelector('.add-to-calendar');
        const downloadIcsBtn = card.querySelector('.download-ics');
        const copyLinkBtn = card.querySelector('.copy-link');

        // Disable actions for past events
        if (isPast) {
            addToCalendarBtn.disabled = true;
            addToCalendarBtn.textContent = '📅 Past Event';
            downloadIcsBtn.style.display = 'none';
        } else {
            addToCalendarBtn.addEventListener('click', () => {
                const googleUrl = window.seminarApp.generateGoogleCalendarURL(event);
                window.open(googleUrl, '_blank');
            });

            downloadIcsBtn.addEventListener('click', () => {
                window.seminarApp.downloadICS(event);
                window.seminarApp.showNotification('Calendar file downloaded!', 'success');
            });
        }

        copyLinkBtn.addEventListener('click', async () => {
            const eventUrl = `${window.location.origin}${window.location.pathname}#${event.id}`;
            try {
                await window.seminarApp.copyToClipboard(eventUrl);
                window.seminarApp.showNotification('Link copied to clipboard!', 'success');
            } catch (error) {
                window.seminarApp.showNotification('Failed to copy link', 'error');
            }
        });

        // Set event IDs for buttons
        addToCalendarBtn.setAttribute('data-event-id', event.id);
        downloadIcsBtn.setAttribute('data-event-id', event.id);
        copyLinkBtn.setAttribute('data-event-id', event.id);
    }

    toggleSectionVisibility(sectionId, show) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('hidden', !show);
        }
    }

    showError(message) {
        const container = document.querySelector('.container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'card';
            errorDiv.style.backgroundColor = 'var(--accent-danger)';
            errorDiv.style.color = 'white';
            errorDiv.style.textAlign = 'center';
            errorDiv.innerHTML = `
                <h3>Error Loading Schedule</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-outline" style="color: white; border-color: white;">
                    Retry
                </button>
            `;
            container.appendChild(errorDiv);
        }

        // Hide loading state
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
    }
}

// Initialize schedule manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        window.scheduleManager = new ScheduleManager();
    }, 100);
});

// Handle deep linking to specific events
window.addEventListener('load', () => {
    if (window.location.hash) {
        const eventId = window.location.hash.substring(1);
        setTimeout(() => {
            const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
            if (eventCard) {
                eventCard.closest('.event-card').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                eventCard.closest('.event-card').style.outline = '2px solid var(--accent-primary)';
                setTimeout(() => {
                    eventCard.closest('.event-card').style.outline = '';
                }, 3000);
            }
        }, 500);
    }
});
