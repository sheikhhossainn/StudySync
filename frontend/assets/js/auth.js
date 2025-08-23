// Auth.js - Main authentication flow handler

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
        this.setupEventListeners();
        this.updateUI();
    }

    parseUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.userType = urlParams.get('type') || 'student';
        this.isSignup = urlParams.get('mode') === 'signup';
    }

    setupEventListeners() {
        // Google OAuth button
        document.getElementById('googleBtn').addEventListener('click', () => {
            this.handleGoogleAuth();
        });

        // Email form
        document.getElementById('emailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailAuth();
        });

        // Phone form
        document.getElementById('phoneForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePhoneVerification();
        });

        // Document form
        document.getElementById('documentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDocumentSubmission();
        });

        // Navigation buttons
        document.getElementById('backToStep1').addEventListener('click', () => {
            this.goToStep(1);
        });

        document.getElementById('backToStep2').addEventListener('click', () => {
            this.goToStep(2);
        });

        // Auth mode switch
        document.getElementById('switchAuthMode').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });

        // File upload handlers
        this.setupFileUploadHandlers();
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

    updateUI() {
        // Update user type indicator
        const indicator = document.getElementById('userTypeIndicator');
        const typeText = document.getElementById('userTypeText');
        const typeIcon = document.getElementById('userTypeIcon');
        
        if (this.userType) {
            indicator.style.display = 'block';
            typeText.textContent = this.userType === 'student' ? 'Student' : 'Mentor';
            typeIcon.textContent = this.userType === 'student' ? '🎓' : '💡';
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
        const switchLink = document.getElementById('switchAuthMode');
        const googleBtnText = document.getElementById('googleBtnText');

        if (this.isSignup) {
            title.textContent = 'Create Your Account';
            subtitle.textContent = 'Join StudySync today';
            googleBtnText.textContent = 'Sign up with Google';
            footerText.innerHTML = 'Already have an account? <a href="#" id="switchAuthMode">Log in</a>';
        } else {
            title.textContent = 'Welcome Back';
            subtitle.textContent = 'Sign in to your account';
            googleBtnText.textContent = 'Continue with Google';
            footerText.innerHTML = 'New to StudySync? <a href="#" id="switchAuthMode">Sign up</a>';
        }

        // Re-attach event listener for the new element
        document.getElementById('switchAuthMode').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
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
                step3Title.textContent = 'Student Verification';
                step3Subtitle.textContent = 'Upload your student ID card';
                studentSection.style.display = 'block';
                mentorSection.style.display = 'none';
                institutionGroup.style.display = 'block';
                companyGroup.style.display = 'none';
            } else {
                step3Title.textContent = 'Mentor Verification';
                step3Subtitle.textContent = 'Upload your documents and professional information';
                studentSection.style.display = 'none';
                mentorSection.style.display = 'block';
                institutionGroup.style.display = 'none';
                companyGroup.style.display = 'block';
            }
        }
    }

    toggleAuthMode() {
        this.isSignup = !this.isSignup;
        this.updateAuthMode();
    }

    async handleGoogleAuth() {
        try {
            // Simulate Google OAuth flow
            console.log('Initiating Google OAuth...');
            
            // In a real app, this would use Google OAuth library
            // For demo, we'll simulate successful authentication
            setTimeout(() => {
                this.userData.email = 'user@gmail.com';
                this.userData.name = 'John Doe';
                this.userData.provider = 'google';
                
                if (this.isSignup) {
                    this.goToStep(2);
                } else {
                    // Check if user exists and redirect accordingly
                    this.checkUserExists();
                }
            }, 1000);
            
        } catch (error) {
            console.error('Google OAuth error:', error);
            this.showError('Google authentication failed. Please try again.');
        }
    }

    async handleEmailAuth() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            if (this.isSignup) {
                // For signup, just collect email and move to next step
                this.userData.email = email;
                this.goToStep(2);
            } else {
                // For login, we would validate credentials
                if (!password) {
                    // Show password field if not visible
                    document.getElementById('passwordGroup').style.display = 'block';
                    document.getElementById('password').required = true;
                    document.getElementById('emailSubmitBtn').textContent = 'Sign In';
                    return;
                }
                
                // Simulate login
                this.userData.email = email;
                this.checkUserExists();
            }
        } catch (error) {
            console.error('Email auth error:', error);
            this.showError('Authentication failed. Please try again.');
        }
    }

    async handlePhoneVerification() {
        const phone = document.getElementById('phone').value;
        const otp = document.getElementById('otp').value;
        const otpGroup = document.getElementById('otpGroup');
        const submitBtn = document.getElementById('phoneSubmitBtn');

        if (!otp) {
            // Send OTP
            if (!phone) {
                this.showError('Please enter your phone number');
                return;
            }

            try {
                // Simulate sending OTP
                console.log('Sending OTP to:', phone);
                
                this.userData.phone = phone;
                otpGroup.style.display = 'block';
                submitBtn.textContent = 'Verify Code';
                
                // In real app, make API call to send OTP
                this.showSuccess('Verification code sent to your phone');
                
            } catch (error) {
                console.error('OTP send error:', error);
                this.showError('Failed to send verification code');
            }
        } else {
            // Verify OTP
            try {
                // Simulate OTP verification
                if (otp.length !== 6) {
                    this.showError('Please enter a valid 6-digit code');
                    return;
                }

                console.log('Verifying OTP:', otp);
                
                // In real app, make API call to verify OTP
                this.userData.phoneVerified = true;
                this.goToStep(3);
                
            } catch (error) {
                console.error('OTP verification error:', error);
                this.showError('Invalid verification code');
            }
        }
    }

    async handleFileUpload(event, inputId) {
        const file = event.target.files[0];
        if (!file) return;

        const previewId = inputId + 'Preview';
        const preview = document.getElementById(previewId);
        const uploadCard = event.target.closest('.upload-card');

        // Show file preview
        preview.textContent = `📎 ${file.name}`;
        uploadCard.classList.add('has-file');

        // Store file for later processing
        this.userData[inputId] = file;

        // If this is an ID card, trigger OCR processing
        if (['studentId', 'nid', 'companyId'].includes(inputId)) {
            this.processWithOCR(file, inputId);
        }
    }

    async processWithOCR(file, type) {
        const ocrStatus = document.getElementById('ocrStatus');
        ocrStatus.style.display = 'block';

        try {
            // Simulate OCR processing
            console.log('Processing', type, 'with OCR...');
            
            // In real app, this would send file to OCR service
            setTimeout(() => {
                this.populateExtractedData(type);
                ocrStatus.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('OCR processing error:', error);
            ocrStatus.style.display = 'none';
            this.showError('Failed to process document. Please try again.');
        }
    }

    populateExtractedData(type) {
        // Simulate extracted data based on document type
        const extractedData = this.getSimulatedOCRData(type);
        
        // Populate form fields
        Object.keys(extractedData).forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.value = extractedData[field];
                input.classList.add('auto-filled');
            }
        });

        this.showSuccess('Document processed successfully!');
    }

    getSimulatedOCRData(type) {
        const baseData = {
            firstName: 'John',
            lastName: 'Doe',
            idNumber: '123456789'
        };

        switch (type) {
            case 'studentId':
                return {
                    ...baseData,
                    institution: 'University of Technology'
                };
            case 'nid':
                return baseData;
            case 'companyId':
                return {
                    ...baseData,
                    company: 'Tech Solutions Inc.'
                };
            default:
                return baseData;
        }
    }

    async handleDocumentSubmission() {
        try {
            // Validate required documents
            if (!this.validateDocuments()) {
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('finalSubmitBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            // Simulate account creation
            setTimeout(() => {
                this.userData.profileComplete = true;
                this.goToStep('success');
            }, 2000);

        } catch (error) {
            console.error('Document submission error:', error);
            this.showError('Failed to create account. Please try again.');
            
            // Reset button
            const submitBtn = document.getElementById('finalSubmitBtn');
            submitBtn.textContent = 'Complete Registration';
            submitBtn.disabled = false;
        }
    }

    validateDocuments() {
        if (this.userType === 'student') {
            if (!this.userData.studentId) {
                this.showError('Please upload your student ID card');
                return false;
            }
        } else {
            if (!this.userData.nid) {
                this.showError('Please upload your National ID card');
                return false;
            }
            if (!this.userData.companyId) {
                this.showError('Please upload your company ID card');
                return false;
            }
            
            // Check professional info
            const experience = document.getElementById('experience').value;
            const expertise = document.getElementById('expertise').value;
            
            if (!experience || !expertise) {
                this.showError('Please complete your professional information');
                return false;
            }
        }
        return true;
    }

    async checkUserExists() {
        // Simulate checking if user exists
        // In real app, make API call
        console.log('Checking if user exists...');
        
        // For demo, assume new users need to complete registration
        if (this.isSignup || !this.userData.profileComplete) {
            this.goToStep(2);
        } else {
            // Redirect to dashboard
            window.location.href = 'index.html';
        }
    }

    goToStep(step) {
        // Hide all steps
        const steps = ['step1', 'step2', 'step3', 'successStep'];
        steps.forEach(stepId => {
            document.getElementById(stepId).style.display = 'none';
        });

        // Show target step
        if (step === 'success') {
            document.getElementById('successStep').style.display = 'block';
            this.updateSuccessMessage();
        } else {
            document.getElementById(`step${step}`).style.display = 'block';
            this.currentStep = step;
        }

        // Update progress indicator
        this.updateProgressIndicator();
        
        // Update step-specific content
        this.updateStepContent();

        // Scroll to top
        window.scrollTo(0, 0);
    }

    updateProgressIndicator() {
        const progressContainer = document.getElementById('progressContainer');
        const steps = document.querySelectorAll('.step');

        if (this.currentStep > 1) {
            progressContainer.style.display = 'block';
        } else {
            progressContainer.style.display = 'none';
        }

        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });
    }

    updateSuccessMessage() {
        const message = document.getElementById('successMessage');
        const userTypeText = this.userType === 'student' ? 'student' : 'mentor';
        message.textContent = `Your ${userTypeText} account has been created successfully. Welcome to StudySync!`;
    }

    showError(message) {
        // Simple error display - in real app, use toast notifications
        alert('Error: ' + message);
    }

    showSuccess(message) {
        // Simple success display - in real app, use toast notifications
        console.log('Success:', message);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
