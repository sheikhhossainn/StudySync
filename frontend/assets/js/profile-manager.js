// Profile Manager - Handles dynamic profile updates and account management

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    loadUserData() {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.populateProfileForm();
        } else {
            // Redirect to login if no user data
            window.location.href = '/auth.html';
        }
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate();
            });
        }

        // Profile picture upload
        const profilePictureInput = document.getElementById('profilePicture');
        if (profilePictureInput) {
            profilePictureInput.addEventListener('change', (e) => {
                this.handleProfilePictureUpload(e);
            });
        }

        // Account deletion
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.handleAccountDeletion();
            });
        }

        // Email verification
        const verifyEmailBtn = document.getElementById('verifyEmailBtn');
        if (verifyEmailBtn) {
            verifyEmailBtn.addEventListener('click', () => {
                this.sendEmailVerification();
            });
        }

        // Phone verification
        const verifyPhoneBtn = document.getElementById('verifyPhoneBtn');
        if (verifyPhoneBtn) {
            verifyPhoneBtn.addEventListener('click', () => {
                this.sendPhoneVerification();
            });
        }

        // Username availability check
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            let usernameTimeout;
            usernameInput.addEventListener('input', (e) => {
                clearTimeout(usernameTimeout);
                usernameTimeout = setTimeout(() => {
                    this.checkUsernameAvailability(e.target.value);
                }, 500);
            });
        }
    }

    populateProfileForm() {
        if (!this.currentUser) return;

        // Populate form fields with current user data
        const fields = {
            'firstName': this.currentUser.first_name,
            'lastName': this.currentUser.last_name,
            'username': this.currentUser.username,
            'email': this.currentUser.email,
            'phone': this.currentUser.phone_number,
            'bio': this.currentUser.bio,
            'institution': this.currentUser.institution,
            'expertise': this.currentUser.expertise,
            'socialLinkedIn': this.currentUser.social_linkedin,
            'socialGitHub': this.currentUser.social_github,
            'socialTwitter': this.currentUser.social_twitter
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });

        // Set profile picture
        const profileImg = document.getElementById('currentProfilePic');
        if (profileImg && this.currentUser.profile_picture) {
            profileImg.src = this.currentUser.profile_picture;
        }

        // Show verification status
        this.updateVerificationStatus();
    }

    updateVerificationStatus() {
        const emailStatus = document.getElementById('emailVerificationStatus');
        const phoneStatus = document.getElementById('phoneVerificationStatus');

        if (emailStatus) {
            emailStatus.innerHTML = this.currentUser.is_email_verified 
                ? '<span class="text-success">✓ Verified</span>' 
                : '<span class="text-warning">⚠ Not verified</span>';
        }

        if (phoneStatus) {
            phoneStatus.innerHTML = this.currentUser.is_phone_verified 
                ? '<span class="text-success">✓ Verified</span>' 
                : '<span class="text-warning">⚠ Not verified</span>';
        }
    }

    async handleProfileUpdate() {
        try {
            this.showLoading('Updating profile...');

            const formData = new FormData(document.getElementById('profileForm'));
            const profileData = Object.fromEntries(formData.entries());

            const response = await fetch('/api/accounts/profile/manage/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                // Update local user data
                this.currentUser = { ...this.currentUser, ...data.user };
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                
                this.showSuccess('Profile updated successfully!');
                this.populateProfileForm(); // Refresh form with updated data
            } else {
                this.showError(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showError('Failed to update profile. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async handleProfilePictureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size must be less than 5MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            this.showError('Please select a valid image file (JPEG, PNG, or GIF)');
            return;
        }

        try {
            this.showLoading('Uploading profile picture...');

            const formData = new FormData();
            formData.append('profile_picture', file);

            const response = await fetch('/api/accounts/profile/upload-picture/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Update profile picture in UI
                const profileImg = document.getElementById('currentProfilePic');
                if (profileImg) {
                    profileImg.src = data.profile_picture_url;
                }

                // Update local user data
                this.currentUser.profile_picture = data.profile_picture_url;
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));

                this.showSuccess('Profile picture updated successfully!');
            } else {
                this.showError(data.error || 'Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Profile picture upload error:', error);
            this.showError('Failed to upload profile picture. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async handleAccountDeletion() {
        const confirmation = confirm(
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including study sessions, payments, and progress.'
        );

        if (!confirmation) return;

        const secondConfirmation = prompt(
            'Type "DELETE" to confirm account deletion:'
        );

        if (secondConfirmation !== 'DELETE') {
            this.showError('Account deletion cancelled.');
            return;
        }

        try {
            this.showLoading('Deleting account...');

            const response = await fetch('/api/accounts/account/delete/', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Clear local storage
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_data');

                this.showSuccess('Account deleted successfully. Redirecting...');

                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            } else {
                this.showError(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            this.showError('Failed to delete account. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async checkUsernameAvailability(username) {
        if (!username || username.length < 3) return;

        try {
            const response = await fetch(`/api/accounts/check/username/?username=${encodeURIComponent(username)}`);
            const data = await response.json();

            const usernameStatus = document.getElementById('usernameStatus');
            if (usernameStatus) {
                if (data.available) {
                    usernameStatus.innerHTML = '<span class="text-success">✓ Available</span>';
                } else {
                    usernameStatus.innerHTML = '<span class="text-danger">✗ Not available</span>';
                }
            }
        } catch (error) {
            console.error('Username check error:', error);
        }
    }

    async sendEmailVerification() {
        try {
            this.showLoading('Sending verification email...');

            const response = await fetch('/api/accounts/verify/email/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Verification email sent! Please check your inbox.');
            } else {
                this.showError(data.error || 'Failed to send verification email');
            }
        } catch (error) {
            console.error('Email verification error:', error);
            this.showError('Failed to send verification email. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async sendPhoneVerification() {
        try {
            this.showLoading('Sending verification SMS...');

            const response = await fetch('/api/accounts/verify/phone/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Verification SMS sent! Please check your phone.');
            } else {
                this.showError(data.error || 'Failed to send verification SMS');
            }
        } catch (error) {
            console.error('Phone verification error:', error);
            this.showError('Failed to send verification SMS. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/accounts/dashboard/data/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.updateDashboardStats(data);
            }
        } catch (error) {
            console.error('Dashboard data error:', error);
        }
    }

    updateDashboardStats(data) {
        // Update dashboard statistics
        const statsElements = {
            'totalSessions': data.total_study_sessions,
            'totalHours': data.total_study_hours,
            'currentStreak': data.current_streak,
            'profileCompletion': data.profile_completion_percentage
        };

        Object.entries(statsElements).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element && value !== undefined) {
                element.textContent = value;
            }
        });

        // Update progress bars
        const progressBars = {
            'profileProgressBar': data.profile_completion_percentage,
            'weeklyGoalProgress': data.weekly_goal_progress
        };

        Object.entries(progressBars).forEach(([elementId, percentage]) => {
            const element = document.getElementById(elementId);
            if (element && percentage !== undefined) {
                element.style.width = `${percentage}%`;
                element.setAttribute('aria-valuenow', percentage);
            }
        });
    }

    // Utility functions
    getCSRFToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    showLoading(message) {
        console.log('Loading:', message);
        // In a real app, show a loading spinner
    }

    hideLoading() {
        console.log('Loading complete');
        // In a real app, hide the loading spinner
    }

    showSuccess(message) {
        console.log('Success:', message);
        // In a real app, show a success toast
        alert('Success: ' + message);
    }

    showError(message) {
        console.log('Error:', message);
        // In a real app, show an error toast
        alert('Error: ' + message);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on dashboard pages
    if (document.getElementById('profileForm') || document.getElementById('dashboardContent')) {
        window.profileManager = new ProfileManager();
    }
});
