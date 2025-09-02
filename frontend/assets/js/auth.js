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
        // Note: Google OAuth button is handled by the Google Identity Services API
        // The handleGoogleResponse method will be called directly from the global function

        // Document form (Step 4)
        const documentForm = document.getElementById('documentForm');
        if (documentForm) {
            documentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDocumentSubmission();
            });
        }

        // Navigation buttons
        const backToStep1 = document.getElementById('backToStep1');
        if (backToStep1) {
            backToStep1.addEventListener('click', () => {
                this.goToStep(1);
            });
        }

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
        const googleButton = document.querySelector('.g_id_signin');

        if (this.isSignup) {
            if (title) title.textContent = `Create Your ${this.userType === 'student' ? 'Student' : 'Mentor'} Account`;
            if (subtitle) subtitle.textContent = `Join StudySync as a ${this.userType}`;
            if (footerText) footerText.innerHTML = 'Already have an account? <a href="#" id="switchAuthMode">Log in</a>';
            
            // Update Google button for signup
            if (googleButton) {
                googleButton.setAttribute('data-text', 'signup_with');
            }
        } else {
            if (title) title.textContent = 'Welcome Back';
            if (subtitle) subtitle.textContent = 'Sign in to your account';
            if (footerText) footerText.innerHTML = 'New to StudySync? <a href="#" id="switchAuthMode">Sign up</a>';
            
            // Update Google button for login
            if (googleButton) {
                googleButton.setAttribute('data-text', 'signin_with');
            }
        }

        // Re-attach event listener for the new switchAuthMode element
        const newSwitchAuthMode = document.getElementById('switchAuthMode');
        if (newSwitchAuthMode) {
            newSwitchAuthMode.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
        
        // Re-render Google button with new text
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.renderButton(googleButton, {
                type: 'standard',
                shape: 'rectangular',
                theme: 'outline',
                text: this.isSignup ? 'signup_with' : 'signin_with',
                size: 'large',
                logo_alignment: 'left'
            });
        }
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

    // Handle Google Sign-In response from the Google Identity Services
    async handleGoogleResponse(googleUser, credential) {
        try {
            console.log('🎯 Processing Google authentication for:', googleUser.email);
            console.log('📊 Current auth state - userType:', this.userType);
            
            this.showLoading('Processing Google authentication...');
            
            // Store user data
            this.userData.email = googleUser.email;
            this.userData.name = googleUser.name;
            this.userData.googleId = googleUser.id;
            this.userData.profilePicture = googleUser.picture;
            this.userData.credential = credential;
            
            // Store basic info from Google
            this.userData.first_name = googleUser.name.split(' ')[0] || '';
            this.userData.last_name = googleUser.name.split(' ').slice(1).join(' ') || '';
            
            console.log('💾 User data stored:', this.userData);
            
            // For signup flow - always proceed to document upload
            console.log('✅ Proceeding with signup flow...');
            
            // Show progress indicator for signup
            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer) {
                progressContainer.style.display = 'block';
            }
            
            this.showSuccess('Google account connected! Please upload your ID documents for verification.');
            
            // Go directly to document upload step (Step 4)
            this.goToStep(4);
            
        } catch (error) {
            console.error('💥 Google auth processing error:', error);
            this.showError('Failed to process Google authentication. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async handleGoogleAuth() {
        try {
            this.showLoading('Connecting to Google...');
            
            // Initialize Google OAuth
            await this.initializeGoogleAuth();
            
            // Sign in with Google
            const googleUser = await this.signInWithGoogle();
            
            if (googleUser) {
                this.userData.email = googleUser.email;
                this.userData.name = googleUser.name;
                this.userData.googleId = googleUser.id;
                this.userData.profilePicture = googleUser.picture;
                
                if (this.isSignup) {
                    // For signup - use the new dynamic OAuth endpoint
                    await this.completeGoogleSignup(googleUser);
                } else {
                    // For login - check if user exists first
                    const userExists = await this.checkUserExists(googleUser.email);
                    
                    if (userExists) {
                        await this.completeGoogleLogin(googleUser);
                    } else {
                        this.showError('Account not found. Please sign up first.');
                        this.toggleAuthMode();
                    }
                }
            }
        } catch (error) {
            console.error('Google auth error:', error);
            this.showError('Google authentication failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async completeGoogleSignup(googleUser) {
        try {
            console.log('🚀 Completing Google signup with minimal profile and OCR data...');
            
            // Prepare the signup payload with minimal required data
            const signupData = {
                credential: this.userData.credential,
                email: googleUser.email,
                name: googleUser.name,
                google_id: googleUser.id,
                profile_picture: googleUser.picture,
                user_type: this.userType,
                first_name: this.userData.first_name,
                last_name: this.userData.last_name,
                // Include OCR processed data
                document_verification: {
                    student_id_data: this.userData.student_id_data || null,
                    nid_data: this.userData.nid_data || null,
                    company_id_data: this.userData.company_id_data || null,
                    name_verification_warning: this.userData.name_verification_warning || false,
                    ocr_processing_failed: this.userData.ocr_processing_failed || false,
                    ocr_error: this.userData.ocr_error || null
                }
            };
            
            console.log('📤 Sending signup data to backend:', signupData);

            // Use the dynamic OAuth signup endpoint
            const response = await fetch('http://127.0.0.1:8000/api/auth/auth/google/oauth/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(signupData)
            });

            const data = await response.json();
            console.log('📥 Backend response:', data);

            if (response.ok) {
                // Store user data and tokens
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                this.showSuccess('Account created successfully! Welcome to StudySync!');
                
                // Redirect to appropriate dashboard
                setTimeout(() => {
                    const dashboardUrl = this.userType === 'student' ? '/student-dashboard.html' : '/mentor-dashboard.html';
                    window.location.href = dashboardUrl;
                }, 2000);
            } else {
                console.error('❌ Signup failed:', data);
                this.showError(data.error || data.message || 'Account creation failed. Please try again.');
            }
        } catch (error) {
            console.error('💥 Google signup error:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }

    // Collect form data from current step
    collectFormData() {
        const formData = {};
        
        // Collect basic info
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const phone = document.getElementById('phone');
        const institution = document.getElementById('institution');
        const major = document.getElementById('major');
        const yearOfStudy = document.getElementById('yearOfStudy');
        
        // Basic fields
        if (firstName && firstName.value) formData.first_name = firstName.value.trim();
        if (lastName && lastName.value) formData.last_name = lastName.value.trim();
        if (phone && phone.value) formData.phone = phone.value.trim();
        
        // Student-specific fields
        if (this.userType === 'student') {
            if (institution && institution.value) formData.institution = institution.value.trim();
            if (major && major.value) formData.major = major.value.trim();
            if (yearOfStudy && yearOfStudy.value) formData.year_of_study = yearOfStudy.value;
        }
        
        // Mentor-specific fields (collected from userData if already stored)
        if (this.userType === 'mentor') {
            if (this.userData.experience) formData.experience = this.userData.experience;
            if (this.userData.expertise) formData.expertise = this.userData.expertise;
        }
        
        console.log('📋 Collected form data:', formData);
        return formData;
    }

    // Handle profile form submission (Step 2) - DEPRECATED
    async handleProfileSubmission() {
        // This method is deprecated in the simplified flow
        console.log('Profile submission deprecated - going directly to documents');
        this.goToStep(4);
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

        // Validate file type and size
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            this.showError('Please upload a valid image file (JPEG, PNG)');
            return;
        }

        if (file.size > maxSize) {
            this.showError('File size must be less than 5MB');
            return;
        }

        const previewId = inputId + 'Preview';
        const preview = document.getElementById(previewId);
        const uploadCard = event.target.closest('.upload-card');

        // Show file preview
        preview.textContent = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        uploadCard.classList.add('has-file');

        // Store file for later processing with proper naming
        const fileKey = inputId + 'File';
        this.userData[fileKey] = file;
        
        console.log(`📁 File stored as ${fileKey}:`, file.name);

        // If this is an ID card, show OCR processing indicator
        if (['studentId', 'nid', 'companyId'].includes(inputId)) {
            this.showOCRPreview(file, inputId);
        }
    }

    async showOCRPreview(file, type) {
        const ocrStatus = document.getElementById('ocrStatus') || this.createOCRStatusElement();
        ocrStatus.style.display = 'block';
        ocrStatus.innerHTML = `
            <div class="ocr-preview">
                <i class="fas fa-eye"></i>
                <span>Document uploaded successfully. OCR processing will happen during account creation.</span>
            </div>
        `;

        // Hide after 3 seconds
        setTimeout(() => {
            ocrStatus.style.display = 'none';
        }, 3000);
    }

    createOCRStatusElement() {
        const statusElement = document.createElement('div');
        statusElement.id = 'ocrStatus';
        statusElement.className = 'ocr-status';
        statusElement.style.cssText = 'display: none; margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 5px; color: #1976d2;';
        
        // Insert after the upload section
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.appendChild(statusElement);
        }
        
        return statusElement;
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
            console.log('📄 Processing document submission...');
            
            // Validate required documents
            if (!this.validateDocuments()) {
                return;
            }

            this.showLoading('Processing documents and creating account...');

            // Process uploaded documents with OCR
            const documentData = await this.processDocumentsWithOCR();
            
            // Merge document data with user data
            this.userData = { ...this.userData, ...documentData };
            console.log('📋 Final user data with OCR:', this.userData);

            // Complete Google signup with all collected data
            if (this.userData.credential) {
                const googleUser = {
                    email: this.userData.email,
                    name: this.userData.name,
                    id: this.userData.googleId,
                    picture: this.userData.profilePicture
                };
                
                await this.completeGoogleSignup(googleUser);
            } else {
                this.showError('Authentication session expired. Please start over.');
            }

        } catch (error) {
            console.error('Document submission error:', error);
            this.showError('Failed to process documents and create account. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async processDocumentsWithOCR() {
        const documentData = {};
        const ocrProcessor = new OCRProcessor();
        
        try {
            if (this.userType === 'student') {
                // Process student ID
                if (this.userData.studentIdFile) {
                    console.log('🔍 Processing student ID with OCR...');
                    const studentIdData = await ocrProcessor.processDocument(this.userData.studentIdFile, 'studentId');
                    documentData.student_id_data = studentIdData;
                    
                    // Validate name matches
                    if (studentIdData.name && this.userData.name) {
                        const similarity = this.calculateNameSimilarity(studentIdData.name, this.userData.name);
                        if (similarity < 0.7) {
                            console.warn('⚠️ Name mismatch detected:', studentIdData.name, 'vs', this.userData.name);
                            documentData.name_verification_warning = true;
                        }
                    }
                }
            } else {
                // Process mentor documents (NID and Company ID)
                if (this.userData.nidFile) {
                    console.log('🔍 Processing NID with OCR...');
                    const nidData = await ocrProcessor.processDocument(this.userData.nidFile, 'nid');
                    documentData.nid_data = nidData;
                }
                
                if (this.userData.companyIdFile) {
                    console.log('🔍 Processing company ID with OCR...');
                    const companyIdData = await ocrProcessor.processDocument(this.userData.companyIdFile, 'companyId');
                    documentData.company_id_data = companyIdData;
                }
            }
            
            return documentData;
            
        } catch (error) {
            console.error('OCR processing failed:', error);
            // Continue with signup even if OCR fails, but flag for manual review
            documentData.ocr_processing_failed = true;
            documentData.ocr_error = error.message;
            return documentData;
        }
    }

    calculateNameSimilarity(name1, name2) {
        // Simple similarity calculation - can be improved with more sophisticated algorithms
        const normalize = (str) => str.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        const n1 = normalize(name1);
        const n2 = normalize(name2);
        
        const longer = n1.length > n2.length ? n1 : n2;
        const shorter = n1.length > n2.length ? n2 : n1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
        matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i);

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    validateDocuments() {
        if (this.userType === 'student') {
            if (!this.userData.studentIdFile) {
                this.showError('Please upload your Student ID card');
                return false;
            }
        } else if (this.userType === 'mentor') {
            if (!this.userData.nidFile) {
                this.showError('Please upload your National ID card');
                return false;
            }
            if (!this.userData.companyIdFile) {
                this.showError('Please upload your Organization/Company ID card');
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

    showLoading(message) {
        // Simple loading display - in real app, use proper loading spinner
        console.log('Loading:', message);
    }

    hideLoading() {
        // Hide loading display
        console.log('Loading complete');
    }

    // Google OAuth Helper Functions
    async initializeGoogleAuth() {
        return new Promise((resolve, reject) => {
            if (typeof gapi === 'undefined') {
                // Load Google API script if not already loaded
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    gapi.load('auth2', () => {
                        gapi.auth2.init({
                            client_id: window.GOOGLE_CLIENT_ID || '339455167241-4mn5tvs12l3n0uhr29dk5ca1vm83uga5.apps.googleusercontent.com'
                        }).then(resolve).catch(reject);
                    });
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                if (gapi.auth2.getAuthInstance()) {
                    resolve();
                } else {
                    gapi.load('auth2', () => {
                        gapi.auth2.init({
                            client_id: window.GOOGLE_CLIENT_ID || '339455167241-4mn5tvs12l3n0uhr29dk5ca1vm83uga5.apps.googleusercontent.com'
                        }).then(resolve).catch(reject);
                    });
                }
            }
        });
    }

    async signInWithGoogle() {
        const authInstance = gapi.auth2.getAuthInstance();
        const googleUser = await authInstance.signIn();
        const profile = googleUser.getBasicProfile();
        
        return {
            id: profile.getId(),
            email: profile.getEmail(),
            name: profile.getName(),
            picture: profile.getImageUrl()
        };
    }

    async completeGoogleLogin(googleUser) {
        try {
            // Use existing login endpoint
            const response = await fetch('/api/auth/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    email: googleUser.email,
                    password: '', // OAuth login doesn't use password
                    oauth_provider: 'google',
                    google_id: googleUser.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                this.showSuccess('Login successful! Redirecting...');
                
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                this.showError(data.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async checkUserExists(email) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/auth/check/email/?email=${encodeURIComponent(email)}`);
            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }

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
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
