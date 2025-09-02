// StudySync Post Creation Manager
class PostCreationManager {
    constructor() {
        this.apiBaseUrl = window.StudySyncConfig?.API_BASE_URL || 'http://localhost:8000';
        this.modal = null;
        this.form = null;
    }

    init() {
        this.modal = document.getElementById('postModal');
        this.form = document.getElementById('postForm');
        
        if (this.form) {
            this.setupFormValidation();
            this.setupFormSubmission();
        }
    }

    setupFormValidation() {
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Real-time character count for title and content
        const titleField = document.getElementById('postTitle');
        const contentField = document.getElementById('postContent');
        
        if (titleField) {
            this.addCharacterCounter(titleField, 255);
        }
        
        if (contentField) {
            this.addCharacterCounter(contentField, 1000);
        }

        // Subject area "Other" handling
        const subjectField = document.getElementById('subjectArea');
        if (subjectField) {
            subjectField.addEventListener('change', (e) => {
                if (e.target.value === 'Other') {
                    this.showCustomSubjectInput();
                }
            });
        }
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                return;
            }

            await this.submitPost();
        });
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = 'This field is required.';
            isValid = false;
        }

        // Specific field validations
        switch (field.id) {
            case 'postTitle':
                if (value && value.length < 5) {
                    errorMessage = 'Title must be at least 5 characters long.';
                    isValid = false;
                } else if (value && value.length > 255) {
                    errorMessage = 'Title must be less than 255 characters.';
                    isValid = false;
                }
                break;

            case 'postContent':
                if (value && value.length < 10) {
                    errorMessage = 'Description must be at least 10 characters long.';
                    isValid = false;
                } else if (value && value.length > 1000) {
                    errorMessage = 'Description must be less than 1000 characters.';
                    isValid = false;
                }
                break;

            case 'expiresAt':
                if (value) {
                    const expiryDate = new Date(value);
                    const now = new Date();
                    if (expiryDate <= now) {
                        errorMessage = 'Expiry date must be in the future.';
                        isValid = false;
                    }
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    addCharacterCounter(field, maxLength) {
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        
        const updateCounter = () => {
            const remaining = maxLength - field.value.length;
            counter.textContent = `${field.value.length}/${maxLength}`;
            counter.classList.toggle('warning', remaining < 50);
            counter.classList.toggle('error', remaining < 0);
        };

        field.addEventListener('input', updateCounter);
        updateCounter();
        
        field.parentNode.appendChild(counter);
    }

    showCustomSubjectInput() {
        const subjectField = document.getElementById('subjectArea');
        if (!subjectField || document.getElementById('customSubject')) return;

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.id = 'customSubject';
        customInput.name = 'custom_subject';
        customInput.placeholder = 'Enter your subject';
        customInput.className = 'form-control';
        customInput.style.marginTop = '0.5rem';

        customInput.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                // Update the hidden value
                subjectField.setAttribute('data-custom-value', e.target.value.trim());
            }
        });

        subjectField.parentNode.appendChild(customInput);
        customInput.focus();
    }

    async submitPost() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            // Disable submit button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            const formData = new FormData(this.form);
            const postData = this.buildPostData(formData);

            const response = await fetch(`${this.apiBaseUrl}/api/study-sessions/posts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                const newPost = await response.json();
                this.handlePostSuccess(newPost);
            } else {
                const errorData = await response.json();
                this.handlePostError(errorData);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification('Network error. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    buildPostData(formData) {
        let subjectArea = formData.get('subject_area');
        
        // Handle custom subject
        if (subjectArea === 'Other') {
            const customSubject = document.getElementById('customSubject');
            if (customSubject && customSubject.value.trim()) {
                subjectArea = customSubject.value.trim();
            }
        }

        const postData = {
            title: formData.get('title').trim(),
            content: formData.get('content').trim(),
            post_type: formData.get('post_type'),
            subject_area: subjectArea,
            difficulty_level: formData.get('difficulty_level') || null,
            expires_at: formData.get('expires_at') || null,
            tags: this.parseTags(formData.get('tags'))
        };

        return postData;
    }

    parseTags(tagsString) {
        if (!tagsString) return [];
        
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10); // Limit to 10 tags
    }

    handlePostSuccess(newPost) {
        this.closeModal();
        this.showNotification('Post created successfully!', 'success');
        
        // Refresh the feed if the manager exists
        if (window.studySessionsManager) {
            window.studySessionsManager.loadStudySessions();
        }

        // Track analytics (if implemented)
        this.trackPostCreation(newPost);
    }

    handlePostError(errorData) {
        if (errorData.detail) {
            this.showNotification(errorData.detail, 'error');
        } else if (errorData.non_field_errors) {
            this.showNotification(errorData.non_field_errors[0], 'error');
        } else {
            // Handle field-specific errors
            Object.keys(errorData).forEach(field => {
                const fieldElement = this.form.querySelector(`[name="${field}"]`);
                if (fieldElement && errorData[field]) {
                    this.showFieldError(fieldElement, errorData[field][0]);
                }
            });
        }
    }

    openModal() {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            this.showNotification('Please log in to create a post.', 'error');
            setTimeout(() => {
                window.location.href = 'user-selection.html';
            }, 1500);
            return;
        }

        // Check user permissions (premium features)
        this.checkUserPermissions();
        
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Focus the first input
            const firstInput = this.form.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            this.resetForm();
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
            
            // Clear custom subject input if exists
            const customSubject = document.getElementById('customSubject');
            if (customSubject) {
                customSubject.remove();
            }

            // Clear all errors
            const errorElements = this.form.querySelectorAll('.field-error');
            errorElements.forEach(error => error.remove());
            
            const errorFields = this.form.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));
        }
    }

    async checkUserPermissions() {
        try {
            const userData = localStorage.getItem('user_data');
            if (!userData) return;

            const user = JSON.parse(userData);
            
            // Check if user can create mentorship posts
            const mentorshipOption = this.form.querySelector('option[value="mentorship"]');
            if (mentorshipOption && !user.is_premium) {
                mentorshipOption.disabled = true;
                mentorshipOption.textContent += ' (Premium only)';
            }

            // Add note about post limits for free users
            if (!user.is_premium) {
                this.showPostLimitInfo();
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
        }
    }

    showPostLimitInfo() {
        const existingInfo = this.form.querySelector('.post-limit-info');
        if (existingInfo) return;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'post-limit-info';
        infoDiv.innerHTML = `
            <div class="alert alert-info">
                <strong>Free account:</strong> You can create up to 5 posts per month. 
                <a href="payment.html">Upgrade to Premium</a> for unlimited posts.
            </div>
        `;

        this.form.insertBefore(infoDiv, this.form.firstChild);
    }

    trackPostCreation(post) {
        // Analytics tracking - implement based on your analytics service
        if (window.gtag) {
            gtag('event', 'post_created', {
                'post_type': post.post_type,
                'subject_area': post.subject_area,
                'difficulty_level': post.difficulty_level
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for modal management
let postCreationManager;

function openPostModal() {
    if (!postCreationManager) {
        postCreationManager = new PostCreationManager();
        postCreationManager.init();
    }
    postCreationManager.openModal();
}

function closePostModal() {
    if (postCreationManager) {
        postCreationManager.closeModal();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    postCreationManager = new PostCreationManager();
    postCreationManager.init();

    // Close modal when clicking outside
    const modal = document.getElementById('postModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePostModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            closePostModal();
        }
    });
});
