// Import OAuth2Service
import oauth2Service from './oauth2-service.js';

// Auth.js - OAuth 2.0 Authentication Manager
class AuthManager {
    constructor() {
        this.currentStep = 1;
        this.userType = null;
        this.isSignup = false;
        this.userData = {};
        this.init();
    }

    init() {
        this.parseUrl();
        this.setupOAuthProviders();
        this.setupEventListeners();
        this.updateUI();
        this.checkAuthState();
    }

    parseUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.userType = urlParams.get('type') || 'student';
        this.isSignup = urlParams.get('mode') === 'signup';
        
        // Check if this is an OAuth callback
        if (urlParams.has('code') || urlParams.has('error')) {
            this.handleOAuthCallback();
        }
    }

    setupOAuthProviders() {
        // Initialize OAuth providers with client IDs (replace with actual client IDs)
        oauth2Service.initializeProvider('google', 'YOUR_GOOGLE_CLIENT_ID');
        oauth2Service.initializeProvider('facebook', 'YOUR_FACEBOOK_CLIENT_ID');
        oauth2Service.initializeProvider('github', 'YOUR_GITHUB_CLIENT_ID');
    }

    setupEventListeners() {
        // OAuth Social Login buttons
        this.setupOAuthButtons();

        // Traditional email/password forms
        this.setupTraditionalForms();

        // Navigation buttons
        this.setupNavigationButtons();

        // Auth mode switch
        this.setupAuthModeSwitch();

        // File upload handlers
        this.setupFileUploadHandlers();

        // Listen for auth events
        window.addEventListener('userLoggedIn', (e) => this.handleUserLogin(e));
        window.addEventListener('userLoggedOut', (e) => this.handleUserLogout(e));
    }

    setupOAuthButtons() {
        // Google OAuth button
        const googleBtn = document.getElementById('googleBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    this.showLoading('Signing in with Google...');
                    await oauth2Service.signInWithGoogle();
                } catch (error) {
                    console.error('Google sign-in error:', error);
                    this.showError('Google sign-in failed. Please try again.');
                }
            });
        }

        // Facebook OAuth button
        const facebookBtn = document.getElementById('facebookBtn');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    this.showLoading('Signing in with Facebook...');
                    await oauth2Service.signInWithFacebook();
                } catch (error) {
                    console.error('Facebook sign-in error:', error);
                    this.showError('Facebook sign-in failed. Please try again.');
                }
            });
        }

        // GitHub OAuth button
        const githubBtn = document.getElementById('githubBtn');
        if (githubBtn) {
            githubBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    this.showLoading('Redirecting to GitHub...');
                    await oauth2Service.signInWithGitHub();
                } catch (error) {
                    console.error('GitHub sign-in error:', error);
                    this.showError('GitHub sign-in failed. Please try again.');
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await oauth2Service.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                    oauth2Service.logout(); // Force logout on error
                }
            });
        }
    }

    setupTraditionalForms() {
        // Email form
        const emailForm = document.getElementById('emailForm');
        if (emailForm) {
            emailForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEmailAuth();
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleTraditionalLogin();
            });
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleTraditionalSignup();
            });
        }

        // Phone form
        const phoneForm = document.getElementById('phoneForm');
        if (phoneForm) {
            phoneForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePhoneVerification();
            });
        }

        // Document form
        const documentForm = document.getElementById('documentForm');
        if (documentForm) {
            documentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDocumentSubmission();
            });
        }
    }

    setupNavigationButtons() {
        const backToStep1 = document.getElementById('backToStep1');
        if (backToStep1) {
            backToStep1.addEventListener('click', () => this.goToStep(1));
        }

        const backToStep2 = document.getElementById('backToStep2');
        if (backToStep2) {
            backToStep2.addEventListener('click', () => this.goToStep(2));
        }
    }

    setupAuthModeSwitch() {
        const switchAuthMode = document.getElementById('switchAuthMode');
        if (switchAuthMode) {
            switchAuthMode.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
    }

    setupFileUploadHandlers() {
        const fileInputs = ['studentId', 'nid', 'companyId'];
        
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.handleFileUpload(e, inputId);
                });
            }
        });
    }

    checkAuthState() {
        if (oauth2Service.isAuthenticated()) {
            this.updateUIForAuthenticatedUser();
        } else {
            this.updateUIForUnauthenticatedUser();
        }
    }

    async handleOAuthCallback() {
        try {
            this.showLoading('Processing authentication...');
            
            const authData = await oauth2Service.handleCallback();
            
            // Get user data after successful auth
            const userData = await oauth2Service.getCurrentUser();
            
            this.showSuccess('Authentication successful!');
            
            // Trigger login event
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: { 
                    user: userData,
                    access_token: oauth2Service.getAccessToken()
                } 
            }));

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect or continue with verification if needed
            this.handleSuccessfulAuth(userData);
            
        } catch (error) {
            console.error('OAuth callback error:', error);
            this.showError('Authentication failed. Please try again.');
            
            // Clean up URL and redirect to login
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }

    async handleTraditionalLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            this.showLoading('Signing in...');
            
            const response = await fetch('http://localhost:8000/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens and user data
                oauth2Service.storeTokens(data.access_token, data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.profile) {
                    localStorage.setItem('profile', JSON.stringify(data.profile));
                }

                this.showSuccess('Login successful!');
                
                // Trigger login event
                window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data }));

                // Handle successful authentication
                this.handleSuccessfulAuth(data.user);
            } else {
                this.showError(data.detail || data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async handleTraditionalSignup() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        try {
            this.showLoading('Creating account...');
            
            const response = await fetch('http://localhost:8000/api/auth/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    user_type: this.userType
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Account created successfully!');
                
                // Store user data and move to verification
                this.userData = { ...this.userData, ...data };
                
                // Move to phone verification step
                this.goToStep(2);
            } else {
                const errorMessage = data.detail || data.error || 'Signup failed';
                this.showError(errorMessage);
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async handleEmailAuth() {
        const email = document.getElementById('email').value;

        if (!email) {
            this.showError('Please enter your email address');
            return;
        }

        try {
            if (this.isSignup) {
                // For signup, collect email and move to next step
                this.userData.email = email;
                this.goToStep(2);
            } else {
                // For login, check if user exists
                this.showLoading('Checking account...');
                
                const response = await fetch(`http://localhost:8000/api/auth/check-email/?email=${encodeURIComponent(email)}`);
                const data = await response.json();
                
                if (data.exists) {
                    // Show password field
                    document.getElementById('passwordGroup').style.display = 'block';
                    document.getElementById('password').required = true;
                    document.getElementById('emailSubmitBtn').textContent = 'Sign In';
                    this.userData.email = email;
                } else {
                    this.showError('Account not found. Please sign up first.');
                }
            }
        } catch (error) {
            console.error('Email check error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async handlePhoneVerification() {
        const phone = document.getElementById('phone').value;

        if (!phone) {
            this.showError('Please enter your phone number');
            return;
        }

        try {
            this.showLoading('Sending verification code...');
            
            const response = await fetch('http://localhost:8000/api/auth/send-sms/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: phone,
                    email: this.userData.email
                })
            });

            if (response.ok) {
                this.userData.phone = phone;
                this.showSuccess('Verification code sent!');
                this.goToStep(3);
            } else {
                const data = await response.json();
                this.showError(data.error || 'Failed to send verification code');
            }
        } catch (error) {
            console.error('Phone verification error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async handleDocumentSubmission() {
        const formData = new FormData();
        const requiredFiles = this.userType === 'student' ? ['studentId'] : ['nid', 'companyId'];
        
        // Check if all required files are uploaded
        for (const fileId of requiredFiles) {
            const fileInput = document.getElementById(fileId);
            if (!fileInput.files[0]) {
                this.showError(`Please upload your ${fileId === 'studentId' ? 'Student ID' : fileId === 'nid' ? 'National ID' : 'Company ID'}`);
                return;
            }
            formData.append(fileId, fileInput.files[0]);
        }

        // Add additional form data
        const institution = document.getElementById('institution');
        const company = document.getElementById('company');
        
        if (institution && institution.value) {
            formData.append('institution', institution.value);
        }
        
        if (company && company.value) {
            formData.append('company', company.value);
        }

        try {
            this.showLoading('Submitting documents...');
            
            const response = await oauth2Service.apiRequest('http://localhost:8000/api/auth/verify-documents/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.showSuccess('Documents submitted successfully! Your account is under review.');
                
                // Redirect to appropriate page
                setTimeout(() => {
                    this.redirectAfterAuth(this.userType);
                }, 2000);
            } else {
                const data = await response.json();
                this.showError(data.error || 'Document submission failed');
            }
        } catch (error) {
            console.error('Document submission error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    handleSuccessfulAuth(user) {
        // Check if user needs additional verification
        if (!user.is_verified || (user.user_type && !user.profile_complete)) {
            // Redirect to verification steps
            this.goToStep(2);
        } else {
            // Redirect to main application
            this.redirectAfterAuth(user.user_type);
        }
    }

    redirectAfterAuth(userType) {
        setTimeout(() => {
            switch (userType) {
                case 'student':
                    window.location.href = 'index.html';
                    break;
                case 'teacher':
                case 'mentor':
                    window.location.href = 'index.html';
                    break;
                default:
                    window.location.href = 'user-selection.html';
            }
        }, 1500);
    }

    handleUserLogin(event) {
        const { user } = event.detail;
        this.updateUIForAuthenticatedUser(user);
    }

    handleUserLogout() {
        this.updateUIForUnauthenticatedUser();
        this.showSuccess('Logged out successfully');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }

    updateUIForAuthenticatedUser(user = null) {
        if (!user) {
            try {
                user = JSON.parse(localStorage.getItem('user'));
            } catch (e) {
                console.warn('Could not parse stored user data');
                return;
            }
        }

        if (!user) return;

        // Update UI elements based on authentication status
        const authElements = document.querySelectorAll('[data-auth="required"]');
        authElements.forEach(el => el.style.display = 'block');

        const unauthElements = document.querySelectorAll('[data-auth="hidden"]');
        unauthElements.forEach(el => el.style.display = 'none');

        // Update user info display
        const userNameElements = document.querySelectorAll('[data-user="name"]');
        userNameElements.forEach(el => {
            el.textContent = user.first_name || user.username || user.email;
        });

        const userTypeElements = document.querySelectorAll('[data-user="type"]');
        userTypeElements.forEach(el => {
            el.textContent = user.user_type || 'User';
        });
    }

    updateUIForUnauthenticatedUser() {
        const authElements = document.querySelectorAll('[data-auth="required"]');
        authElements.forEach(el => el.style.display = 'none');

        const unauthElements = document.querySelectorAll('[data-auth="hidden"]');
        unauthElements.forEach(el => el.style.display = 'block');
    }

    updateUI() {
        // Update user type indicator
        const indicator = document.getElementById('userTypeIndicator');
        const typeText = document.getElementById('userTypeText');
        const typeIcon = document.getElementById('userTypeIcon');
        
        if (this.userType && indicator) {
            indicator.style.display = 'block';
            if (typeText) typeText.textContent = this.userType === 'student' ? 'Student' : 'Mentor';
            if (typeIcon) typeIcon.textContent = this.userType === 'student' ? '🎓' : '💡';
        }

        // Update auth title and mode
        this.updateAuthMode();
        
        // Update step-specific content
        this.updateStepContent();
    }

    updateAuthMode() {
        const title = document.getElementById('authTitle');
        const subtitle = document.getElementById('authSubtitle');
        const footerText = document.getElementById('authFooterText');
        const googleBtnText = document.getElementById('googleBtnText');

        if (this.isSignup) {
            if (title) title.textContent = 'Create Your Account';
            if (subtitle) subtitle.textContent = 'Join StudySync today';
            if (googleBtnText) googleBtnText.textContent = 'Sign up with Google';
            if (footerText) footerText.innerHTML = 'Already have an account? <a href="#" id="switchAuthMode">Log in</a>';
        } else {
            if (title) title.textContent = 'Welcome Back';
            if (subtitle) subtitle.textContent = 'Sign in to your account';
            if (googleBtnText) googleBtnText.textContent = 'Continue with Google';
            if (footerText) footerText.innerHTML = 'New to StudySync? <a href="#" id="switchAuthMode">Sign up</a>';
        }

        // Re-attach event listener for the new element
        this.setupAuthModeSwitch();
    }

    updateStepContent() {
        if (this.currentStep === 3) {
            const step3Title = document.getElementById('step3Title');
            const step3Subtitle = document.getElementById('step3Subtitle');
            const studentSection = document.getElementById('studentSection');
            const mentorSection = document.getElementById('mentorSection');
            const institutionGroup = document.getElementById('institutionGroup');
            const companyGroup = document.getElementById('companyGroup');

            if (this.userType === 'student') {
                if (step3Title) step3Title.textContent = 'Student Verification';
                if (step3Subtitle) step3Subtitle.textContent = 'Upload your student ID card';
                if (studentSection) studentSection.style.display = 'block';
                if (mentorSection) mentorSection.style.display = 'none';
                if (institutionGroup) institutionGroup.style.display = 'block';
                if (companyGroup) companyGroup.style.display = 'none';
            } else {
                if (step3Title) step3Title.textContent = 'Mentor Verification';
                if (step3Subtitle) step3Subtitle.textContent = 'Upload your documents and professional information';
                if (studentSection) studentSection.style.display = 'none';
                if (mentorSection) mentorSection.style.display = 'block';
                if (institutionGroup) institutionGroup.style.display = 'none';
                if (companyGroup) companyGroup.style.display = 'block';
            }
        }
    }

    toggleAuthMode() {
        this.isSignup = !this.isSignup;
        this.updateAuthMode();
    }

    goToStep(step) {
        // Hide all steps
        for (let i = 1; i <= 3; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.style.display = 'none';
            }
        }

        // Show target step
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.style.display = 'block';
        }

        this.currentStep = step;
        this.updateStepContent();
    }

    handleFileUpload(event, fileType) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Please upload a valid image (JPEG, PNG) or PDF file');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size must be less than 5MB');
            event.target.value = '';
            return;
        }

        // Show success message
        this.showSuccess(`${fileType} uploaded successfully`);
    }

    showLoading(message) {
        this.hideAllAlerts();
        this.showAlert(message, 'info', true);
    }

    showSuccess(message) {
        this.hideAllAlerts();
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.hideAllAlerts();
        this.showAlert(message, 'error');
    }

    showAlert(message, type = 'info', isLoading = false) {
        // Remove existing alerts
        this.hideAllAlerts();

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        
        const icon = isLoading ? 'fas fa-spinner fa-spin' : 
                    type === 'success' ? 'fas fa-check-circle' :
                    type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
        
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icon} me-2"></i>
                <span>${message}</span>
                ${!isLoading ? '<button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>' : ''}
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Auto-hide after 5 seconds (except loading alerts)
        if (!isLoading) {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }

    hideAllAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }
}

// Initialize AuthManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Utility functions for backward compatibility
function showAlert(message, type) {
    if (window.authManager) {
        if (type === 'success') {
            window.authManager.showSuccess(message);
        } else if (type === 'error') {
            window.authManager.showError(message);
        } else {
            window.authManager.showAlert(message, type);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
