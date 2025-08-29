// Subscription and Payment Management JavaScript

// API Configuration
const SUBSCRIPTION_ENDPOINTS = {
    PLANS: '/payments/plans/',
    STATUS: '/payments/subscription/status/',
    UPGRADE: '/payments/subscription/upgrade/',
    FEATURES: '/payments/features/',
    ADS: '/payments/ads/',
    AD_IMPRESSION: (adId) => `/payments/ads/${adId}/impression/`,
    AD_CLICK: (adId) => `/payments/ads/${adId}/click/`,
    CANCEL: '/payments/subscription/cancel/',
    PAYMENT_HISTORY: '/payments/history/',
    PREMIUM_FEATURES: '/payments/premium-features/',
};

// Utility function for API requests
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Get CSRF token from cookie
function getCSRFToken() {
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
    return cookieValue || '';
}

// Subscription management class
class SubscriptionManager {
    constructor() {
        this.userStatus = null;
        this.plans = [];
        this.ads = [];
        this.init();
    }

    async init() {
        await this.loadUserStatus();
        await this.loadPlans();
        await this.loadAds();
        this.setupUI();
    }

    // Load user's current subscription status
    async loadUserStatus() {
        try {
            const response = await apiRequest(SUBSCRIPTION_ENDPOINTS.STATUS);
            this.userStatus = response;
            console.log('User subscription status:', this.userStatus);
        } catch (error) {
            console.error('Error loading user status:', error);
        }
    }

    // Load available subscription plans
    async loadPlans() {
        try {
            const response = await apiRequest(SUBSCRIPTION_ENDPOINTS.PLANS);
            this.plans = response;
            console.log('Available plans:', this.plans);
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }

    // Load advertisements for free users
    async loadAds() {
        try {
            if (this.userStatus && this.userStatus.has_ads) {
                const response = await apiRequest(SUBSCRIPTION_ENDPOINTS.ADS);
                this.ads = response;
                console.log('Loaded ads:', this.ads);
            }
        } catch (error) {
            console.error('Error loading ads:', error);
        }
    }

    // Setup UI based on subscription status
    setupUI() {
        this.updateSubscriptionBadge();
        this.updatePostLimitDisplay();
        this.showAdsIfNeeded();
        this.updateMentorshipAccess();
        this.setupUpgradeButton();
        
        // Initialize premium features if user is premium
        this.initializePremiumFeatures();
    }

    // Update subscription badge in header
    updateSubscriptionBadge() {
        const badge = document.querySelector('.subscription-badge');
        if (!badge) return;

        if (this.userStatus.is_premium) {
            badge.className = 'subscription-badge premium';
            badge.textContent = '👑 Premium';
            badge.title = `Premium until ${new Date(this.userStatus.premium_expires_at).toLocaleDateString()}`;
        } else {
            badge.className = 'subscription-badge free';
            badge.textContent = '🆓 Free';
            badge.title = 'Upgrade to Premium for unlimited features';
        }
    }

    // Update post limit display
    updatePostLimitDisplay() {
        const limitDisplay = document.querySelector('.post-limit-display');
        if (!limitDisplay) return;

        if (this.userStatus.is_premium) {
            limitDisplay.innerHTML = `
                <span class="unlimited">✅ Unlimited posts</span>
            `;
        } else {
            const remaining = this.userStatus.post_limit - this.userStatus.current_month_posts;
            limitDisplay.innerHTML = `
                <span class="limited">
                    📝 ${remaining}/${this.userStatus.post_limit} posts remaining this month
                </span>
            `;
            
            if (remaining <= 1) {
                limitDisplay.classList.add('warning');
            }
        }
    }

    // Show ads for free users
    showAdsIfNeeded() {
        if (!this.userStatus.has_ads || this.ads.length === 0) {
            this.hideAllAds();
            return;
        }

        // Show ads in sidebar
        this.showSidebarAds();
        
        // Show ads between content
        this.showContentAds();
    }

    // Hide all ad containers
    hideAllAds() {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.style.display = 'none';
        });
    }

    // Show ads in sidebar
    showSidebarAds() {
        const sidebarAdContainer = document.querySelector('.sidebar-ads');
        if (!sidebarAdContainer) return;

        sidebarAdContainer.innerHTML = '';
        
        this.ads.slice(0, 2).forEach(ad => {
            const adElement = this.createAdElement(ad, 'sidebar');
            sidebarAdContainer.appendChild(adElement);
        });
    }

    // Show ads between content
    showContentAds() {
        const sessionList = document.querySelector('.session-list');
        if (!sessionList || this.ads.length === 0) return;

        const sessionCards = sessionList.querySelectorAll('.session-card');
        
        // Insert ad after every 3rd session card
        sessionCards.forEach((card, index) => {
            if ((index + 1) % 3 === 0 && this.ads[index % this.ads.length]) {
                const ad = this.ads[index % this.ads.length];
                const adElement = this.createAdElement(ad, 'content');
                card.insertAdjacentElement('afterend', adElement);
            }
        });
    }

    // Create ad element
    createAdElement(ad, type) {
        const adDiv = document.createElement('div');
        adDiv.className = `ad-container ${type}-ad`;
        adDiv.setAttribute('data-ad-id', ad.id);

        adDiv.innerHTML = `
            <div class="ad-content">
                <div class="ad-label">Advertisement</div>
                <div class="ad-body">
                    ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.title}" class="ad-image">` : ''}
                    <div class="ad-text">
                        <h4 class="ad-title">${ad.title}</h4>
                        ${ad.content ? `<p class="ad-description">${ad.content}</p>` : ''}
                    </div>
                </div>
                ${ad.click_url ? `<button class="ad-cta" onclick="subscriptionManager.handleAdClick('${ad.id}', '${ad.click_url}')">Learn More</button>` : ''}
            </div>
        `;

        // Track impression when ad is viewed
        this.trackAdImpression(ad.id);

        return adDiv;
    }

    // Track ad impression
    async trackAdImpression(adId) {
        try {
            await apiRequest(SUBSCRIPTION_ENDPOINTS.AD_IMPRESSION(adId), {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error tracking ad impression:', error);
        }
    }

    // Handle ad click
    async handleAdClick(adId, clickUrl) {
        try {
            const response = await apiRequest(SUBSCRIPTION_ENDPOINTS.AD_CLICK(adId), {
                method: 'POST'
            });
            
            if (response.redirect_url) {
                window.open(response.redirect_url, '_blank');
            }
        } catch (error) {
            console.error('Error tracking ad click:', error);
        }
    }

    // Update mentorship access
    updateMentorshipAccess() {
        const mentorshipLinks = document.querySelectorAll('.mentorship-link');
        
        mentorshipLinks.forEach(link => {
            if (!this.userStatus.can_use_mentorship) {
                link.classList.add('premium-only');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showUpgradeModal('mentorship');
                });
            }
        });
    }

    // Setup upgrade button
    setupUpgradeButton() {
        const upgradeBtn = document.querySelector('.upgrade-to-premium-btn');
        if (!upgradeBtn) return;

        if (this.userStatus.is_premium) {
            upgradeBtn.style.display = 'none';
        } else {
            upgradeBtn.style.display = 'block';
            upgradeBtn.addEventListener('click', () => {
                this.showUpgradeModal();
            });
        }
    }

    // Show upgrade modal
    showUpgradeModal(feature = null) {
        const modal = document.getElementById('upgrade-modal') || this.createUpgradeModal();
        
        // Update modal content based on feature
        if (feature === 'mentorship') {
            modal.querySelector('.modal-title').textContent = 'Upgrade for Mentorship';
            modal.querySelector('.modal-description').textContent = 
                'Access our premium mentorship program and connect with industry experts.';
        } else if (feature === 'posts') {
            modal.querySelector('.modal-title').textContent = 'Upgrade for Unlimited Posts';
            modal.querySelector('.modal-description').textContent = 
                'Create unlimited study sessions and group discussions.';
        } else {
            modal.querySelector('.modal-title').textContent = 'Upgrade to Premium';
            modal.querySelector('.modal-description').textContent = 
                'Unlock all features and remove ads for the best StudySync experience.';
        }

        modal.style.display = 'block';
    }

    // Create upgrade modal
    createUpgradeModal() {
        const modal = document.createElement('div');
        modal.id = 'upgrade-modal';
        modal.className = 'modal';

        const premiumPlan = this.plans.find(plan => plan.name === 'Premium Plan');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Upgrade to Premium</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <p class="modal-description">Unlock all features and remove ads for the best StudySync experience.</p>
                    
                    <div class="upgrade-plan">
                        <div class="plan-name">Premium Plan</div>
                        <div class="plan-price">৳${premiumPlan ? premiumPlan.price : '300'}/month</div>
                        <div class="plan-features">
                            <div class="feature">✅ Unlimited study sessions</div>
                            <div class="feature">✅ Access to mentorship program</div>
                            <div class="feature">✅ No advertisements</div>
                            <div class="feature">✅ Priority support</div>
                        </div>
                    </div>
                    
                    <div class="payment-methods">
                        <h3>Choose Payment Method:</h3>
                        <div class="payment-options">
                            <label class="payment-option">
                                <input type="radio" name="payment-method" value="bkash" checked>
                                <img src="/assets/images/bkash.png" alt="bKash">
                                <span>bKash</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment-method" value="nagad">
                                <img src="/assets/images/nagad.png" alt="Nagad">
                                <span>Nagad</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment-method" value="rocket">
                                <img src="/assets/images/rocket.png" alt="Rocket">
                                <span>Rocket</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-upgrade">Upgrade Now</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal event listeners
        this.setupModalEventListeners(modal);

        return modal;
    }

    // Setup modal event listeners
    setupModalEventListeners(modal) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const upgradeBtn = modal.querySelector('.modal-upgrade');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        upgradeBtn.addEventListener('click', () => {
            this.handleUpgrade(modal);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Handle upgrade process
    async handleUpgrade(modal) {
        const selectedPaymentMethod = modal.querySelector('input[name="payment-method"]:checked').value;
        const premiumPlan = this.plans.find(plan => plan.name === 'Premium Plan');
        
        if (!premiumPlan) {
            alert('Premium plan not found. Please try again later.');
            return;
        }

        try {
            const upgradeBtn = modal.querySelector('.modal-upgrade');
            upgradeBtn.disabled = true;
            upgradeBtn.textContent = 'Processing...';

            const response = await apiRequest(SUBSCRIPTION_ENDPOINTS.UPGRADE, {
                method: 'POST',
                body: JSON.stringify({
                    plan_id: premiumPlan.id,
                    payment_method: selectedPaymentMethod,
                    months: 1
                })
            });

            // Update user status
            await this.loadUserStatus();
            this.setupUI();

            modal.style.display = 'none';
            
            // Show success message
            this.showSuccessMessage('🎉 Successfully upgraded to Premium! Welcome to StudySync Premium.');
            
            // Reload the page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Upgrade error:', error);
            alert('Failed to upgrade. Please try again.');
            
            const upgradeBtn = modal.querySelector('.modal-upgrade');
            upgradeBtn.disabled = false;
            upgradeBtn.textContent = 'Upgrade Now';
        }
    }

    // Show success message
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-toast';
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    // Check if user can create post
    canCreatePost() {
        return this.userStatus && this.userStatus.can_create_post;
    }

    // Show post limit warning
    showPostLimitWarning() {
        if (this.userStatus.is_premium) return;
        
        const remaining = this.userStatus.post_limit - this.userStatus.current_month_posts;
        
        if (remaining <= 0) {
            alert('You have reached your monthly post limit. Upgrade to Premium for unlimited posts!');
            this.showUpgradeModal('posts');
            return false;
        } else if (remaining <= 1) {
            const proceed = confirm(
                `You have ${remaining} post remaining this month. ` +
                'Upgrade to Premium for unlimited posts. Continue with this post?'
            );
            if (!proceed) {
                this.showUpgradeModal('posts');
                return false;
            }
        }
        
        return true;
    }

    // ENHANCED PREMIUM FEATURES

    // Initialize premium features when user upgrades
    initializePremiumFeatures() {
        if (this.userStatus && this.userStatus.is_premium) {
            this.enableMentorshipAccess();
            this.enablePrioritySupport();
            this.enableAdvancedAnalytics();
            this.enableFileSharing();
            this.enableCustomThemes();
            this.enableVideoConferencing();
            this.removeAllAds();
            this.addPremiumBadges();
        }
    }

    // Enable mentorship access for premium users
    enableMentorshipAccess() {
        const mentorshipButtons = document.querySelectorAll('.mentorship-btn, .find-mentor-btn');
        mentorshipButtons.forEach(btn => {
            btn.classList.remove('premium-only');
            btn.disabled = false;
            btn.title = 'Access mentorship program';
        });

        this.addMentorshipDashboard();
    }

    // Add mentorship dashboard for premium users
    addMentorshipDashboard() {
        const nav = document.querySelector('.nav');
        if (nav && !nav.querySelector('.mentorship-dashboard')) {
            const mentorshipLink = document.createElement('a');
            mentorshipLink.href = 'mentorship-dashboard.html';
            mentorshipLink.className = 'nav-link mentorship-dashboard premium-feature';
            mentorshipLink.innerHTML = '👨‍🏫 Mentorship';
            nav.insertBefore(mentorshipLink, nav.querySelector('.btn'));
        }
    }

    // Enable priority support features
    enablePrioritySupport() {
        // Add priority support widget
        this.addPrioritySupportWidget();
    }

    // Add priority support widget
    addPrioritySupportWidget() {
        const supportWidget = document.createElement('div');
        supportWidget.className = 'priority-support-widget';
        supportWidget.innerHTML = `
            <div class="support-header">
                <span class="support-icon">🎧</span>
                <span class="support-text">Priority Support</span>
            </div>
            <button class="btn btn-support" onclick="subscriptionManager.openPriorityChat()">
                💬 Chat Now
            </button>
        `;
        supportWidget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem;
            border-radius: 0.75rem;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
            z-index: 1000;
        `;
        document.body.appendChild(supportWidget);
    }

    // Open priority chat
    openPriorityChat() {
        window.open('https://chat.studysync.com/priority', '_blank', 'width=400,height=600');
    }

    // Enable advanced analytics
    enableAdvancedAnalytics() {
        const analyticsBtn = document.createElement('button');
        analyticsBtn.className = 'btn btn-analytics premium-feature';
        analyticsBtn.innerHTML = '📊 My Analytics';
        analyticsBtn.onclick = () => this.showAnalyticsDashboard();
        
        const header = document.querySelector('.header .nav');
        if (header) {
            header.insertBefore(analyticsBtn, header.querySelector('.btn-primary'));
        }
    }

    // Show analytics dashboard
    showAnalyticsDashboard() {
        const modal = this.createAnalyticsModal();
        modal.style.display = 'block';
    }

    // Create analytics modal
    createAnalyticsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal analytics-modal';
        modal.innerHTML = `
            <div class="modal-content analytics-content">
                <div class="modal-header">
                    <h2 class="modal-title">📊 Your Study Analytics</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="card-icon">📚</div>
                            <h3>Study Sessions</h3>
                            <div class="analytics-value">24</div>
                            <div class="analytics-change positive">+12% this month</div>
                        </div>
                        <div class="analytics-card">
                            <div class="card-icon">✍️</div>
                            <h3>Posts Created</h3>
                            <div class="analytics-value">${this.userStatus?.current_month_posts || 0}</div>
                            <div class="analytics-change positive">Unlimited</div>
                        </div>
                        <div class="analytics-card">
                            <div class="card-icon">🤝</div>
                            <h3>Connections</h3>
                            <div class="analytics-value">7</div>
                            <div class="analytics-change positive">+40% this month</div>
                        </div>
                        <div class="analytics-card">
                            <div class="card-icon">⏰</div>
                            <h3>Study Hours</h3>
                            <div class="analytics-value">156h</div>
                            <div class="analytics-change positive">+23% this month</div>
                        </div>
                    </div>
                    <div class="premium-insights">
                        <h3>🔍 Premium Insights</h3>
                        <ul>
                            <li>🎯 Your most productive study time: 2-4 PM</li>
                            <li>📈 Study streak: 12 days (Personal best!)</li>
                            <li>🏆 Top subject: Computer Science</li>
                            <li>👥 Most engaging posts get 85% more responses</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
            modal.remove();
        };

        return modal;
    }

    // Enable file sharing capabilities
    enableFileSharing() {
        this.addFileShareInterface();
    }

    // Add file sharing interface
    addFileShareInterface() {
        const postForms = document.querySelectorAll('.post-form, .create-post-form');
        postForms.forEach(form => {
            if (!form.querySelector('.file-share-section')) {
                const fileSection = document.createElement('div');
                fileSection.className = 'file-share-section premium-feature';
                fileSection.innerHTML = `
                    <div class="file-upload-area">
                        <div class="upload-icon">📎</div>
                        <h4>Attach Files (Premium)</h4>
                        <p>Share PDFs, images, documents with your study group</p>
                        <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.png,.pptx" 
                               id="fileUpload" style="display: none;">
                        <button type="button" class="btn btn-file-upload" 
                                onclick="document.getElementById('fileUpload').click()">
                            Choose Files
                        </button>
                        <div class="file-preview" id="filePreview"></div>
                    </div>
                `;
                form.appendChild(fileSection);

                // Add file preview functionality
                const fileInput = fileSection.querySelector('#fileUpload');
                const filePreview = fileSection.querySelector('#filePreview');
                
                fileInput.addEventListener('change', (e) => {
                    this.handleFilePreview(e.target.files, filePreview);
                });
            }
        });
    }

    // Handle file preview
    handleFilePreview(files, previewContainer) {
        previewContainer.innerHTML = '';
        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-icon">${this.getFileIcon(file.type)}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
            `;
            previewContainer.appendChild(fileItem);
        });
    }

    // Get file icon based on type
    getFileIcon(fileType) {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('document')) return '📝';
        if (fileType.includes('presentation')) return '📊';
        return '📁';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Enable custom themes
    enableCustomThemes() {
        this.addThemeSelector();
        this.loadSavedTheme();
    }

    // Add theme selector
    addThemeSelector() {
        const themeSelector = document.createElement('div');
        themeSelector.className = 'theme-selector premium-feature';
        themeSelector.innerHTML = `
            <div class="theme-header">
                <span class="theme-icon">🎨</span>
                <h4>Premium Themes</h4>
            </div>
            <div class="theme-options">
                <button class="theme-btn" data-theme="default" title="Default">
                    <div class="theme-preview default"></div>
                    <span>Default</span>
                </button>
                <button class="theme-btn" data-theme="dark" title="Dark Mode">
                    <div class="theme-preview dark"></div>
                    <span>Dark</span>
                </button>
                <button class="theme-btn" data-theme="ocean" title="Ocean Blue">
                    <div class="theme-preview ocean"></div>
                    <span>Ocean</span>
                </button>
                <button class="theme-btn" data-theme="forest" title="Forest Green">
                    <div class="theme-preview forest"></div>
                    <span>Forest</span>
                </button>
                <button class="theme-btn" data-theme="sunset" title="Sunset Orange">
                    <div class="theme-preview sunset"></div>
                    <span>Sunset</span>
                </button>
            </div>
        `;

        const sidebar = document.querySelector('.sidebar') || document.querySelector('.container');
        if (sidebar) {
            sidebar.appendChild(themeSelector);
        }

        // Add theme switching functionality
        themeSelector.addEventListener('click', (e) => {
            const themeBtn = e.target.closest('.theme-btn');
            if (themeBtn) {
                this.applyTheme(themeBtn.dataset.theme);
                
                // Update active state
                themeSelector.querySelectorAll('.theme-btn').forEach(btn => 
                    btn.classList.remove('active'));
                themeBtn.classList.add('active');
            }
        });
    }

    // Apply custom theme
    applyTheme(themeName) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        localStorage.setItem('selectedTheme', themeName);
        
        // Add theme-specific styles
        this.injectThemeStyles(themeName);
    }

    // Load saved theme
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
            this.applyTheme(savedTheme);
        }
    }

    // Inject theme-specific styles
    injectThemeStyles(theme) {
        const existingTheme = document.querySelector('#theme-styles');
        if (existingTheme) existingTheme.remove();

        const themeStyles = document.createElement('style');
        themeStyles.id = 'theme-styles';
        
        const themes = {
            dark: `
                .theme-dark { --bg-primary: #1a1a1a; --bg-secondary: #2d2d2d; --text-primary: #ffffff; --text-secondary: #cccccc; }
                .theme-dark .header { background: #2d2d2d; }
                .theme-dark .post-card { background: #2d2d2d; color: #ffffff; }
            `,
            ocean: `
                .theme-ocean { --bg-primary: #0ea5e9; --bg-secondary: #0284c7; --text-primary: #ffffff; }
                .theme-ocean .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
            `,
            forest: `
                .theme-forest { --bg-primary: #059669; --bg-secondary: #047857; --text-primary: #ffffff; }
                .theme-forest .header { background: linear-gradient(135deg, #059669, #047857); }
            `,
            sunset: `
                .theme-sunset { --bg-primary: #f97316; --bg-secondary: #ea580c; --text-primary: #ffffff; }
                .theme-sunset .header { background: linear-gradient(135deg, #f97316, #ea580c); }
            `
        };

        themeStyles.textContent = themes[theme] || '';
        document.head.appendChild(themeStyles);
    }

    // Enable video conferencing
    enableVideoConferencing() {
        this.addVideoCallButtons();
    }

    // Add video call buttons
    addVideoCallButtons() {
        const postCards = document.querySelectorAll('.post-card');
        postCards.forEach(card => {
            if (!card.querySelector('.video-call-btn')) {
                const videoBtn = document.createElement('button');
                videoBtn.className = 'btn btn-video-call premium-feature';
                videoBtn.innerHTML = '📹 Video Study';
                videoBtn.onclick = () => this.startVideoCall(card.dataset.postId);
                
                const actionBtns = card.querySelector('.post-actions');
                if (actionBtns) {
                    actionBtns.appendChild(videoBtn);
                }
            }
        });
    }

    // Start video call
    startVideoCall(postId) {
        const modal = this.createVideoCallModal(postId);
        modal.style.display = 'block';
    }

    // Create video call modal
    createVideoCallModal(postId) {
        const modal = document.createElement('div');
        modal.className = 'modal video-call-modal';
        modal.innerHTML = `
            <div class="modal-content video-content">
                <div class="modal-header">
                    <h2 class="modal-title">📹 Video Study Session</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="video-container">
                        <div class="video-placeholder">
                            <div class="video-icon">📹</div>
                            <p>Video calling feature coming soon!</p>
                            <p>Premium users will be able to start instant video study sessions.</p>
                        </div>
                    </div>
                    <div class="video-controls">
                        <button class="btn btn-primary" onclick="alert('Video feature will be available in next update!')">
                            🚀 Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
            modal.remove();
        };

        return modal;
    }

    // Remove all advertisements
    removeAllAds() {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.remove();
        });
    }

    // Add premium badges
    addPremiumBadges() {
        this.addNoAdsBadge();
        this.addPremiumStatusBadge();
    }

    // Add no-ads badge
    addNoAdsBadge() {
        const container = document.querySelector('.container');
        if (container && !container.querySelector('.no-ads-badge')) {
            const badge = document.createElement('div');
            badge.className = 'no-ads-badge premium-badge';
            badge.innerHTML = '🚫 Ad-Free Experience';
            badge.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                font-size: 0.8rem;
                font-weight: 600;
                z-index: 999;
                animation: fadeInSlide 0.5s ease-out;
            `;
            document.body.appendChild(badge);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                badge.style.animation = 'fadeOutSlide 0.5s ease-out';
                setTimeout(() => badge.remove(), 500);
            }, 5000);
        }
    }

    // Add premium status badge
    addPremiumStatusBadge() {
        const header = document.querySelector('.header .container');
        if (header && !header.querySelector('.premium-status-badge')) {
            const badge = document.createElement('div');
            badge.className = 'premium-status-badge';
            badge.innerHTML = '👑 Premium Active';
            badge.style.cssText = `
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: #92400e;
                padding: 0.375rem 0.75rem;
                border-radius: 0.5rem;
                font-size: 0.8rem;
                font-weight: 600;
                margin-left: auto;
                cursor: pointer;
            `;
            badge.onclick = () => this.showSubscriptionManagement();
            header.appendChild(badge);
        }
    }

    // Show subscription management
    showSubscriptionManagement() {
        const modal = this.createSubscriptionManagementModal();
        modal.style.display = 'block';
    }

    // Create subscription management modal
    createSubscriptionManagementModal() {
        const modal = document.createElement('div');
        modal.className = 'modal subscription-management-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">⚙️ Manage Subscription</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="subscription-info">
                        <div class="current-plan">
                            <h3>🏆 Premium Plan</h3>
                            <p>Active until: ${this.userStatus?.premium_expires_at ? 
                                new Date(this.userStatus.premium_expires_at).toLocaleDateString() : 'N/A'}</p>
                            <p>Monthly billing: 300 BDT</p>
                        </div>
                        <div class="premium-features-list">
                            <h4>Your Premium Features:</h4>
                            <ul>
                                <li>✅ Unlimited posts</li>
                                <li>✅ Ad-free experience</li>
                                <li>✅ Mentorship access</li>
                                <li>✅ Priority support</li>
                                <li>✅ Advanced analytics</li>
                                <li>✅ File sharing</li>
                                <li>✅ Custom themes</li>
                                <li>✅ Video calls (coming soon)</li>
                            </ul>
                        </div>
                    </div>
                    <div class="subscription-actions">
                        <button class="btn btn-secondary" onclick="subscriptionManager.showPaymentHistory()">
                            💳 Payment History
                        </button>
                        <button class="btn btn-secondary" onclick="subscriptionManager.updatePaymentMethod()">
                            💰 Update Payment
                        </button>
                        <button class="btn btn-danger" onclick="subscriptionManager.cancelSubscription()">
                            ❌ Cancel Subscription
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
            modal.remove();
        };

        return modal;
    }

    // Show payment history
    async showPaymentHistory() {
        try {
            const history = await apiRequest(SUBSCRIPTION_ENDPOINTS.PAYMENT_HISTORY);
            const modal = this.createPaymentHistoryModal(history);
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading payment history:', error);
            alert('Failed to load payment history');
        }
    }

    // Create payment history modal
    createPaymentHistoryModal(history) {
        const modal = document.createElement('div');
        modal.className = 'modal payment-history-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">💳 Payment History</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="payment-history-list">
                        ${history && history.length > 0 ? history.map(payment => `
                            <div class="payment-item">
                                <div class="payment-info">
                                    <div class="payment-date">${new Date(payment.created_at).toLocaleDateString()}</div>
                                    <div class="payment-description">${payment.description || 'Premium Subscription'}</div>
                                </div>
                                <div class="payment-details">
                                    <div class="payment-amount">৳${payment.amount}</div>
                                    <div class="payment-method">${payment.payment_method}</div>
                                    <div class="payment-status ${payment.status.toLowerCase()}">${payment.status}</div>
                                </div>
                            </div>
                        `).join('') : '<p>No payment history found.</p>'}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
            modal.remove();
        };

        return modal;
    }

    // Update payment method
    updatePaymentMethod() {
        alert('Payment method update feature will be available soon!');
    }

    // Cancel subscription
    async cancelSubscription() {
        if (confirm('Are you sure you want to cancel your Premium subscription? You will lose access to all premium features.')) {
            try {
                const response = await apiRequest(SUBSCRIPTION_ENDPOINTS.CANCEL, {
                    method: 'POST'
                });

                if (response.success) {
                    this.showSuccessMessage('Subscription cancelled successfully. You can continue using premium features until the end of your billing period.');
                    await this.loadUserStatus();
                    this.setupUI();
                } else {
                    throw new Error(response.message || 'Cancellation failed');
                }
            } catch (error) {
                console.error('Cancellation error:', error);
                alert('Failed to cancel subscription. Please contact support.');
            }
        }
    }

    // Show success message
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast show';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize subscription manager
let subscriptionManager;

document.addEventListener('DOMContentLoaded', function() {
    subscriptionManager = new SubscriptionManager();
    
    // Override the original post creation to check limits
    const originalCreatePost = window.MyPostsAPI ? window.MyPostsAPI.createPost : null;
    
    if (originalCreatePost) {
        window.MyPostsAPI.createPost = async function(postData) {
            if (!subscriptionManager.showPostLimitWarning()) {
                return;
            }
            
            // Check if mentorship post is allowed
            if (postData.post_type === 'mentorship' && !subscriptionManager.userStatus.can_use_mentorship) {
                alert('Mentorship posts are only available for Premium users!');
                subscriptionManager.showUpgradeModal('mentorship');
                return;
            }
            
            return originalCreatePost(postData);
        };
    }
});

// Export for global access
window.SubscriptionManager = SubscriptionManager;
