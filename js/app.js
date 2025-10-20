// Main application JavaScript for Complex Systems Seminar website
// Handles navigation, theme management, and common utilities

class SeminarApp {
    constructor() {
        this.settings = null;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupNavigation();
        this.setupServiceWorker();
        this.updateDynamicContent();
    }

    async loadSettings() {
        try {
            const response = await fetch('data/settings.json');
            this.settings = await response.json();
        } catch (error) {
            console.warn('Could not load settings:', error);
            // Fallback settings
            this.settings = {
                seminar_title: "Modern Theory of Complex Systems & Applications",
                timezone: "Asia/Jerusalem",
                contact_email: "roman.gaidarov@weizmann.ac.il",
                calendar_subscribe_url: "https://calendar.google.com/calendar/u/0?cid=REPLACE",
                mailing_list_url: "https://groups.google.com/g/REPLACE",
                formspree_action: "https://formspree.io/f/REPLACE_WITH_YOUR_CODE",
                campus: "Rehovot",
                default_room: "Physics Lec. Room A",
                repo_url: "https://github.com/USERNAME/REPO"
            };
        }
    }

    setupNavigation() {
        const navToggle = document.querySelector('.nav-toggle');
        const nav = document.querySelector('.nav');

        if (navToggle && nav) {
            navToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                const isExpanded = nav.classList.contains('active');
                navToggle.setAttribute('aria-expanded', isExpanded);
            });

            // Close nav when clicking outside
            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
                    nav.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Close nav when pressing Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    updateDynamicContent() {
        // Update calendar subscription links
        const calendarLinks = document.querySelectorAll('#subscribe-calendar');
        calendarLinks.forEach(link => {
            link.href = this.settings.calendar_subscribe_url;
        });

        // Update mailing list links
        const mailingListLinks = document.querySelectorAll('#mailing-list');
        mailingListLinks.forEach(link => {
            link.href = this.settings.mailing_list_url;
        });

        // Load next talk info on homepage
        if (document.getElementById('next-talk-info')) {
            this.loadNextTalkInfo();
        }
    }

    async loadNextTalkInfo() {
        try {
            const response = await fetch('data/schedule.json');
            const schedule = await response.json();
            const now = new Date();
            
            const upcomingTalks = schedule
                .filter(talk => new Date(talk.datetime) > now)
                .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

            const nextTalkElement = document.getElementById('next-talk-info');
            
            if (upcomingTalks.length > 0) {
                const nextTalk = upcomingTalks[0];
                const talkDate = new Date(nextTalk.datetime);
                const formattedDate = this.formatDateTime(talkDate, this.settings.timezone);
                
                nextTalkElement.innerHTML = `
                    <strong>${nextTalk.title}</strong><br>
                    <span style="color: var(--text-secondary);">
                        ${nextTalk.speakers.join(', ')} • ${formattedDate}
                    </span>
                `;
            } else {
                nextTalkElement.innerHTML = `
                    <strong>No upcoming talks scheduled</strong><br>
                    <span style="color: var(--text-secondary);">
                        Check back soon or <a href="submit.html">propose a talk</a>
                    </span>
                `;
            }
        } catch (error) {
            console.warn('Could not load next talk info:', error);
            const nextTalkElement = document.getElementById('next-talk-info');
            if (nextTalkElement) {
                nextTalkElement.innerHTML = `
                    <strong>Schedule loading...</strong><br>
                    <span style="color: var(--text-secondary);">
                        <a href="schedule.html">View full schedule</a>
                    </span>
                `;
            }
        }
    }

    // Utility functions
    formatDateTime(date, timezone = 'Asia/Jerusalem') {
        const options = {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    }

    generateICS(event) {
        const startDate = new Date(event.datetime);
        const endDate = new Date(startDate.getTime() + (event.duration_min * 60000));
        
        const formatICSDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const escapeICS = (text) => {
            return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
        };

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Complex Systems Seminar//EN',
            'BEGIN:VEVENT',
            `UID:${event.id}@complexsystems.weizmann.ac.il`,
            `DTSTART:${formatICSDate(startDate)}`,
            `DTEND:${formatICSDate(endDate)}`,
            `SUMMARY:${escapeICS(event.title)}`,
            `DESCRIPTION:${escapeICS(event.abstract)}\\n\\nSpeakers: ${escapeICS(event.speakers.join(', '))}`,
            `LOCATION:${escapeICS(event.room || this.settings.default_room)}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        return icsContent;
    }

    downloadICS(event) {
        const icsContent = this.generateICS(event);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.id}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    generateGoogleCalendarURL(event) {
        const startDate = new Date(event.datetime);
        const endDate = new Date(startDate.getTime() + (event.duration_min * 60000));
        
        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
            details: `${event.abstract}\n\nSpeakers: ${event.speakers.join(', ')}`,
            location: event.room || this.settings.default_room,
            ctz: this.settings.timezone
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: var(--accent-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'});
            color: white;
            border-radius: var(--border-radius);
            box-shadow: 0 4px 12px var(--shadow);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Debounce utility for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.seminarApp = new SeminarApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeminarApp;
}
