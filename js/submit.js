// Speaker submission form functionality for Complex Systems Seminar website
// Handles form validation, submission, and user feedback

class SubmissionManager {
    constructor() {
        this.form = document.getElementById('speaker-form');
        this.submitBtn = document.getElementById('submit-btn');
        this.successMessage = document.getElementById('success-message');
        this.errorMessage = document.getElementById('error-message');
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.setupFormValidation();
        this.setupFormSubmission();
        this.setupCharacterCounters();
    }

    setupFormValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Real-time validation for email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                if (emailInput.value && !this.isValidEmail(emailInput.value)) {
                    this.showFieldError(emailInput, 'Please enter a valid email address');
                } else {
                    this.clearFieldError(emailInput);
                }
            });
        }

        // Abstract length validation
        const abstractInput = document.getElementById('abstract');
        if (abstractInput) {
            abstractInput.addEventListener('input', () => {
                const lines = abstractInput.value.split('\n').length;
                const words = abstractInput.value.trim().split(/\s+/).length;
                
                if (abstractInput.value.trim() && (lines < 8 || words < 80)) {
                    this.showFieldError(abstractInput, 'Abstract should be 10-12 lines (approximately 80-150 words)');
                } else if (lines > 15 || words > 200) {
                    this.showFieldError(abstractInput, 'Abstract is too long. Please keep it to 10-12 lines');
                } else {
                    this.clearFieldError(abstractInput);
                }
            });
        }

        // References validation
        const referencesInput = document.getElementById('references');
        if (referencesInput) {
            referencesInput.addEventListener('input', () => {
                const lines = referencesInput.value.trim().split('\n').filter(line => line.trim());
                const invalidUrls = lines.filter(line => line.trim() && !this.isValidUrl(line.trim()));
                
                if (invalidUrls.length > 0) {
                    this.showFieldError(referencesInput, 'Please enter valid URLs (one per line)');
                } else if (lines.length > 3) {
                    this.showFieldError(referencesInput, 'Please provide no more than 3 references');
                } else {
                    this.clearFieldError(referencesInput);
                }
            });
        }
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                window.seminarApp.showNotification('Please fix the errors in the form', 'error');
                return;
            }

            await this.submitForm();
        });
    }

    setupCharacterCounters() {
        const abstractInput = document.getElementById('abstract');
        if (abstractInput) {
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.style.cssText = `
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
                text-align: right;
                margin-top: var(--spacing-xs);
            `;
            abstractInput.parentNode.appendChild(counter);

            const updateCounter = () => {
                const lines = abstractInput.value.split('\n').length;
                const words = abstractInput.value.trim().split(/\s+/).filter(word => word).length;
                counter.textContent = `${lines} lines, ${words} words`;
                
                if (lines >= 10 && lines <= 12 && words >= 80 && words <= 150) {
                    counter.style.color = 'var(--accent-success)';
                } else if (lines > 15 || words > 200) {
                    counter.style.color = 'var(--accent-danger)';
                } else {
                    counter.style.color = 'var(--text-secondary)';
                }
            };

            abstractInput.addEventListener('input', updateCounter);
            updateCounter();
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        // Specific field validations
        switch (fieldName) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;

            case 'abstract':
                const lines = value.split('\n').length;
                const words = value.trim().split(/\s+/).filter(word => word).length;
                
                if (value && (lines < 8 || words < 60)) {
                    this.showFieldError(field, 'Abstract should be 10-12 lines (approximately 80-150 words)');
                    return false;
                } else if (lines > 15 || words > 200) {
                    this.showFieldError(field, 'Abstract is too long. Please keep it to 10-12 lines');
                    return false;
                }
                break;

            case 'references':
                if (value) {
                    const urls = value.split('\n').filter(line => line.trim());
                    const invalidUrls = urls.filter(url => !this.isValidUrl(url.trim()));
                    
                    if (invalidUrls.length > 0) {
                        this.showFieldError(field, 'Please enter valid URLs (one per line)');
                        return false;
                    }
                    
                    if (urls.length > 3) {
                        this.showFieldError(field, 'Please provide no more than 3 references');
                        return false;
                    }
                }
                break;

            case 'title':
                if (value && value.length > 100) {
                    this.showFieldError(field, 'Title should be under 100 characters');
                    return false;
                }
                break;
        }

        return true;
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async submitForm() {
        this.setSubmitState(true);

        try {
            const formData = new FormData(this.form);
            
            // Process references into structured format
            const referencesText = formData.get('references');
            if (referencesText) {
                const references = referencesText.split('\n')
                    .filter(line => line.trim())
                    .map((url, index) => `Reference ${index + 1}: ${url.trim()}`)
                    .join('\n');
                formData.set('references', references);
            }

            // Add metadata
            formData.append('_subject', 'New Speaker Proposal - Complex Systems Seminar');
            formData.append('_cc', 'roman.gaidarov@weizmann.ac.il');
            formData.append('_next', window.location.href + '#success');

            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess();
                this.form.reset();
                
                // Reset character counters
                const counters = document.querySelectorAll('.character-counter');
                counters.forEach(counter => {
                    if (counter.textContent.includes('lines')) {
                        counter.textContent = '0 lines, 0 words';
                        counter.style.color = 'var(--text-secondary)';
                    }
                });
                
                window.seminarApp.showNotification('Proposal submitted successfully!', 'success');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showError(error.message);
            window.seminarApp.showNotification('Failed to submit proposal. Please try again.', 'error');
        } finally {
            this.setSubmitState(false);
        }
    }

    setSubmitState(isSubmitting) {
        this.submitBtn.disabled = isSubmitting;
        
        if (isSubmitting) {
            this.submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
        } else {
            this.submitBtn.innerHTML = 'Submit Proposal';
        }
    }

    showSuccess() {
        this.form.classList.add('hidden');
        this.successMessage.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');
        
        // Scroll to success message
        this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showError(message) {
        this.errorMessage.classList.remove('hidden');
        this.successMessage.classList.add('hidden');
        
        // Update error message if provided
        if (message) {
            const errorText = this.errorMessage.querySelector('p');
            if (errorText) {
                errorText.textContent = message;
            }
        }
        
        // Scroll to error message
        this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        field.classList.remove('error');
        field.removeAttribute('aria-invalid');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    }
}

// Initialize submission manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.submissionManager = new SubmissionManager();
});

// Add CSS for error states
const style = document.createElement('style');
style.textContent = `
    .form-input.error,
    .form-textarea.error,
    .form-select.error {
        border-color: var(--accent-danger);
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
    
    .form-error {
        display: none;
    }
    
    .character-counter {
        transition: color var(--transition-fast);
    }
`;
document.head.appendChild(style);
