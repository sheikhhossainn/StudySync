// Premium Membership JavaScript

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Get auth token from localStorage (if user is logged in)
function getAuthToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('authToken') || '';
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getAuthToken();
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
}

// Show premium payment form
function showPremiumPayment() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        alert('Please log in first to upgrade to premium.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Hide the premium plan card and show payment form
    const premiumCard = document.querySelector('.premium-plan-card');
    const trialBanner = document.querySelector('.trial-banner');
    
    if (premiumCard) {
        premiumCard.style.display = 'none';
    }
    if (trialBanner) {
        trialBanner.style.display = 'none';
    }
    
    // Show payment form container
    const paymentContainer = document.getElementById('payment-form-container');
    if (paymentContainer) {
        paymentContainer.style.display = 'block';
        
        // Load subscription plans from backend
        loadSubscriptionPlans();
        
        // Scroll to payment form
        paymentContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Check authentication status and update UI accordingly
function checkAuthenticationStatus() {
    if (isAuthenticated()) {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        console.log('User is authenticated:', userData);
        
        // Show user info somewhere if needed
        updateUserInfo(userData);
        
        // Enable premium upgrade button
        const upgradeButtons = document.querySelectorAll('.btn-premium');
        upgradeButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.textContent.replace('Log in to', '');
        });
        
    } else {
        console.log('User is not authenticated');
        
        // Update button text to indicate login requirement
        const upgradeButtons = document.querySelectorAll('.btn-premium');
        upgradeButtons.forEach(btn => {
            btn.textContent = 'Log in to Upgrade';
        });
    }
}

// Update user info display
function updateUserInfo(userData) {
    // Update any user-specific content
    const userElements = document.querySelectorAll('.user-name');
    userElements.forEach(el => {
        el.textContent = userData.first_name || userData.email || 'User';
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Premium page loaded');
    
    // Check authentication status
    checkAuthenticationStatus();
    
    // Setup payment method listeners initially (for the HTML content)
    setupPaymentMethodListeners();
});

// Load subscription plans from backend
function loadSubscriptionPlans() {
    fetch('/api/payments/subscription-plans/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.plans) {
            updatePlanOptions(data.plans);
        }
    })
    .catch(error => {
        console.error('Error loading subscription plans:', error);
        // Use default plans if API fails
    });
}

// Update plan options in the UI
function updatePlanOptions(plans) {
    const planContainer = document.querySelector('.plan-options');
    if (!planContainer) return;
    
    // Clear existing plans
    planContainer.innerHTML = '';
    
    // Add each plan
    plans.forEach(plan => {
        const planElement = document.createElement('div');
        planElement.className = 'plan-option';
        planElement.innerHTML = `
            <input type="radio" id="${plan.id}" name="plan" value="${plan.id}" data-price="${plan.price}">
            <label for="${plan.id}">
                <h4>${plan.name}</h4>
                <p>$${plan.price}/${plan.duration}</p>
                <ul>
                    ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </label>
        `;
        planContainer.appendChild(planElement);
    });
}

// Process subscription
function processSubscription(plan, price, method) {
    if (!isAuthenticated()) {
        alert('Please log in first to subscribe.');
        window.location.href = 'auth.html';
        return;
    }

    console.log('Processing subscription:', { plan, price, method });
    
    // Collect form data
    const planElement = document.querySelector('input[name="plan"]:checked');
    const selectedPlan = planElement ? planElement.value : plan;
    const selectedMethod = method;

    if (!selectedPlan || !selectedMethod) {
        alert('Please select both a plan and payment method.');
        return;
    }

    // Show loading state
    showLoading();

    // Prepare subscription data
    const subscriptionData = {
        plan: selectedPlan,
        payment_method: selectedMethod,
        amount: price,
        user_id: getUserId()
    };

    // Call backend to process subscription
    fetch('/api/payments/create-payment/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(subscriptionData)
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            // Redirect to payment gateway
            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                alert('Payment initiated successfully!');
            }
        } else {
            alert('Error processing payment: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error processing subscription:', error);
        alert('Error processing subscription. Please try again.');
    });
}

// Utility functions
function showLoading() {
    // Add loading state to the payment form
    const paymentButton = document.querySelector('.payment-button');
    if (paymentButton) {
        paymentButton.textContent = 'Processing...';
        paymentButton.disabled = true;
    }
}

function hideLoading() {
    // Remove loading state
    const paymentButton = document.querySelector('.payment-button');
    if (paymentButton) {
        paymentButton.textContent = 'Subscribe Now';
        paymentButton.disabled = false;
    }
}

function getUserId() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return userData.id || userData.user_id || null;
}

// Load subscription plans from backend
async function loadSubscriptionPlans() {
    try {
        const plans = await apiRequest('/payments/subscription-plans/');
        
        // Find premium plan (default to first plan if none found)
        const premiumPlan = plans.find(plan => plan.name.toLowerCase().includes('premium')) || plans[0];
        
        if (premiumPlan) {
            updatePaymentSummary(premiumPlan);
        }
        
        // Also load payment methods
        await loadPaymentMethods();
        
    } catch (error) {
        console.error('Error loading subscription plans:', error);
        // Use fallback plan
        const fallbackPlan = {
            id: 1,
            name: 'Premium Monthly',
            price: '299.00',
            currency: 'BDT',
            duration_days: 30
        };
        updatePaymentSummary(fallbackPlan);
        
        // Still try to load payment methods
        await loadPaymentMethods();
    }
}

// Load payment methods from backend and update UI
async function loadPaymentMethods() {
    try {
        const paymentMethods = await apiRequest('/payments/payment-methods/');
        console.log('Loaded payment methods:', paymentMethods);
        
        // Update the payment methods in the UI
        updatePaymentMethodsUI(paymentMethods);
        
    } catch (error) {
        console.error('Error loading payment methods:', error);
        // Show fallback payment methods
        showFallbackPaymentMethods();
    }
}

// Update payment methods UI with data from backend
function updatePaymentMethodsUI(paymentMethods) {
    const paymentForm = document.getElementById('payment-form');
    if (!paymentForm) return;
    
    // Find the payment method section
    let paymentMethodSection = paymentForm.querySelector('.form-section');
    if (!paymentMethodSection) return;
    
    // Create new payment methods HTML
    let paymentMethodsHTML = `
        <h4>Payment Method <span class="required-text">(Please select a payment method)</span></h4>
    `;
    
    // Add mobile payments section
    if (paymentMethods.mobile_payments && paymentMethods.mobile_payments.length > 0) {
        paymentMethodsHTML += `
            <div class="payment-category">
                <h5 class="payment-category-title">Mobile Banking</h5>
                <p class="payment-category-subtitle">Pay using your mobile banking account</p>
                <div class="payment-options-grid">
        `;
        
        paymentMethods.mobile_payments.forEach(method => {
            if (method.enabled) {
                paymentMethodsHTML += `
                    <div class="payment-method-option">
                        <input type="radio" id="${method.id}" name="payment-method" value="${method.id}">
                        <label for="${method.id}" class="payment-method-label">
                            <div class="payment-logo-container">
                                <div class="payment-logo ${method.id}-logo">
                                    ${getPaymentIcon(method.id)}
                                </div>
                            </div>
                        </label>
                    </div>
                `;
            }
        });
        
        paymentMethodsHTML += `
                </div>
            </div>
        `;
    }
    
    // Add card payments section
    if (paymentMethods.card_payments && paymentMethods.card_payments.length > 0) {
        paymentMethodsHTML += `
            <div class="payment-category">
                <h5 class="payment-category-title">Card Payment</h5>
                <p class="payment-category-subtitle">Pay using your credit or debit card</p>
                <div class="payment-options-grid">
        `;
        
        paymentMethods.card_payments.forEach(method => {
            if (method.enabled) {
                paymentMethodsHTML += `
                    <div class="payment-method-option">
                        <input type="radio" id="${method.id}" name="payment-method" value="${method.id}">
                        <label for="${method.id}" class="payment-method-label">
                            <div class="payment-logo-container">
                                <div class="payment-logo ${method.id}-logo">
                                    ${getPaymentIcon(method.id)}
                                </div>
                            </div>
                        </label>
                    </div>
                `;
            }
        });
        
        paymentMethodsHTML += `
                </div>
            </div>
        `;
    }
    
    // Add other methods section
    if (paymentMethods.other_methods && paymentMethods.other_methods.length > 0) {
        paymentMethodsHTML += `
            <div class="payment-category">
                <h5 class="payment-category-title">Other Methods</h5>
                <p class="payment-category-subtitle">Alternative payment options</p>
                <div class="payment-options-grid">
        `;
        
        paymentMethods.other_methods.forEach(method => {
            if (method.enabled) {
                paymentMethodsHTML += `
                    <div class="payment-method-option">
                        <input type="radio" id="${method.id}" name="payment-method" value="${method.id}">
                        <label for="${method.id}" class="payment-method-label">
                            <div class="payment-logo-container">
                                <div class="payment-logo ${method.id}-logo">
                                    ${getPaymentIcon(method.id)}
                                </div>
                            </div>
                        </label>
                    </div>
                `;
            }
        });
        
        paymentMethodsHTML += `
                </div>
            </div>
        `;
    }
    
    // Add terms and conditions
    paymentMethodsHTML += `
        <div class="terms-section">
            <label class="terms-checkbox">
                <input type="checkbox" id="terms-agreement" required>
                <span class="checkmark"></span>
                I agree to the <a href="#" class="terms-link">Terms & Conditions</a>
            </label>
        </div>
    `;
    
    // Update the section
    paymentMethodSection.innerHTML = paymentMethodsHTML;
    
    // Re-attach event listeners
    setupPaymentMethodListeners();
}

// Get payment icon HTML for each method
function getPaymentIcon(methodId) {
    const icons = {
        'bkash': '<img src="https://seeklogo.com/images/B/bkash-logo-FBB258B90F-seeklogo.com.png" alt="bKash" class="payment-icon">',
        'nagad': '<img src="https://seeklogo.com/images/N/nagad-logo-7A70CCFEE4-seeklogo.com.png" alt="Nagad" class="payment-icon">',
        'aamarpay': `
            <img src="https://aamarpay.com/assets/img/AamarPay%20Logo%20Lite.png" alt="AamarPay" class="payment-icon">
            <div class="supported-cards">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iIzAwNTFBNSIvPgo8dGV4dCB4PSIyMCIgeT0iMTQiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPVZJU0E8L3RleHQ+Cjwvc3ZnPgo=" alt="Visa" class="card-brand">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMiIgcj0iOCIgZmlsbD0iI0VCMDAxQiIvPgo8Y2lyY2xlIGN4PSIyNiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjRkY1RjAwIi8+Cjwvc3ZnPgo=" alt="Mastercard" class="card-brand">
            </div>
        `,
        'bank_transfer': '<span>🏦</span>'
    };
    
    return icons[methodId] || `<span>${methodId}</span>`;
}

// Show fallback payment methods if API fails
function showFallbackPaymentMethods() {
    console.log('Showing fallback payment methods');
    // The HTML already has the payment methods, so just show a message
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        setupPaymentMethodListeners();
    }
}

// Setup payment method event listeners
function setupPaymentMethodListeners() {
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            const cardDetails = document.getElementById('card-details');
            const mobileBankingDetails = document.getElementById('mobile-banking-details');
            
            if (this.value === 'aamarpay') {
                // AamarPay handles card details on their site, no need to show card form
                if (cardDetails) cardDetails.style.display = 'none';
                if (mobileBankingDetails) mobileBankingDetails.style.display = 'none';
            } else if (['bkash', 'nagad'].includes(this.value)) {
                // Mobile banking - show instructions
                if (cardDetails) cardDetails.style.display = 'none';
                if (mobileBankingDetails) {
                    mobileBankingDetails.style.display = 'block';
                    updateMobileBankingInstructions(this.value);
                }
            } else {
                // Other methods
                if (cardDetails) cardDetails.style.display = 'none';
                if (mobileBankingDetails) mobileBankingDetails.style.display = 'none';
            }
        });
    });
}

// Update payment summary with plan details
function updatePaymentSummary(plan) {
    const formTitle = document.getElementById('form-title');
    const paymentSummary = document.getElementById('payment-summary');
    
    if (formTitle) {
        formTitle.textContent = 'Complete Your Premium Upgrade';
    }
    
    if (paymentSummary) {
        paymentSummary.innerHTML = `
            <div class="payment-summary-content">
                <div class="summary-header">
                    <h4>📋 Order Summary</h4>
                </div>
                <div class="summary-item">
                    <span class="summary-label">👑 ${plan.name}</span>
                    <span class="summary-value">${plan.currency} ${plan.price}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">📅 Duration</span>
                    <span class="summary-value">${plan.duration_days} days</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-item summary-total">
                    <span class="summary-label">Total Amount</span>
                    <span class="summary-value">${plan.currency} ${plan.price}</span>
                </div>
                <div class="summary-note">
                    <p>✓ Instant activation after payment</p>
                    <p>✓ Access to all premium features</p>
                    <p>✓ Cancel anytime from your account</p>
                </div>
            </div>
        `;
    }
    
    // Store plan details for payment processing
    window.selectedPlan = plan;
}

// Start free trial
async function startFreeTrial() {
    if (!isAuthenticated()) {
        alert('Please log in first to start your free trial.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Show confirmation
    if (confirm('🎉 Start your 7-day free trial of StudySync Premium?\n\n✓ Access all premium features immediately\n✓ No payment required for 7 days\n✓ Cancel anytime')) {
        try {
            const result = await apiRequest('/payments/start-trial/', {
                method: 'POST',
            });
            
            if (result.success) {
                alert(`🚀 Congratulations! Your 7-day free trial is now active!\n\n✨ Trial expires: ${new Date(result.expires_at).toLocaleDateString()}\n\nYou now have access to all premium features:\n• Ad-free experience\n• Unlimited posts & questions\n• Priority mentorship access\n• Advanced analytics\n• Unlimited file sharing\n• Premium themes\n\nEnjoy your premium experience!`);
                
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                alert('❌ Failed to start trial: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Trial activation error:', error);
            alert('❌ Failed to start trial. Please try again.');
        }
    }
}

// Go back to premium options
function goBack() {
    const premiumCard = document.querySelector('.premium-plan-card');
    const trialBanner = document.querySelector('.trial-banner');
    const paymentContainer = document.getElementById('payment-form-container');
    
    if (premiumCard) {
        premiumCard.style.display = 'block';
    }
    if (trialBanner) {
        trialBanner.style.display = 'block';
    }
    if (paymentContainer) {
        paymentContainer.style.display = 'none';
    }
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initiate payment with backend
async function initiatePayment(paymentData) {
    try {
        const response = await apiRequest('/payments/initiate/', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
        
        return response;
    } catch (error) {
        console.error('Payment initiation error:', error);
        throw error;
    }
}

// Verify payment with backend
async function verifyPayment(paymentId, transactionId) {
    try {
        const response = await apiRequest('/payments/verify/', {
            method: 'POST',
            body: JSON.stringify({
                payment_id: paymentId,
                transaction_id: transactionId,
            }),
        });
        
        return response;
    } catch (error) {
        console.error('Payment verification error:', error);
        throw error;
    }
}

// Handle payment form submission
document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.getElementById('payment-form');
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
            const termsAccepted = document.getElementById('terms-agreement')?.checked;
            
            // Validation
            if (!selectedMethod) {
                alert('❌ Please select a payment method');
                return;
            }
            
            if (!termsAccepted) {
                alert('❌ Please accept the Terms & Conditions');
                return;
            }
            
            if (!isAuthenticated()) {
                alert('❌ Please log in first');
                window.location.href = 'auth.html';
                return;
            }
            
            if (!window.selectedPlan) {
                alert('❌ Plan information not loaded. Please refresh and try again.');
                return;
            }
            
            // Show loading state
            const submitButton = document.getElementById('submit-payment');
            const buttonText = document.getElementById('button-text');
            const spinner = document.getElementById('spinner');
            
            if (submitButton && buttonText && spinner) {
                submitButton.disabled = true;
                buttonText.textContent = 'Processing...';
                spinner.classList.remove('hidden');
            }
            
            try {
                // Prepare payment data
                const paymentData = {
                    plan_id: window.selectedPlan.id,
                    payment_method: selectedMethod.value,
                    amount: window.selectedPlan.price,
                    currency: window.selectedPlan.currency,
                    billing_info: {
                        email: document.getElementById('billing-email')?.value,
                        name: document.getElementById('billing-name')?.value,
                        address: document.getElementById('billing-address')?.value,
                        city: document.getElementById('billing-city')?.value,
                        state: document.getElementById('billing-state')?.value,
                        zip: document.getElementById('billing-zip')?.value,
                    }
                };
                
                // Add mobile banking details if selected
                if (['bkash', 'nagad'].includes(selectedMethod.value)) {
                    paymentData.mobile_number = document.getElementById('mobile-number')?.value;
                    paymentData.transaction_id = document.getElementById('transaction-id')?.value;
                    paymentData.reference_note = document.getElementById('reference-note')?.value;
                }
                
                // Initiate payment
                const paymentResult = await initiatePayment(paymentData);
                
                if (paymentResult.success) {
                    if (selectedMethod.value === 'aamarpay') {
                        // Handle AamarPay card payment (redirect to AamarPay gateway)
                        if (paymentResult.redirect_url || paymentResult.checkout_url) {
                            window.location.href = paymentResult.redirect_url || paymentResult.checkout_url;
                        } else {
                            alert('❌ AamarPay payment redirect not available. Please try again.');
                        }
                    } else {
                        // Handle mobile banking payment
                        handleMobileBankingPayment(paymentResult, selectedMethod.value);
                    }
                } else {
                    alert('❌ Payment initiation failed: ' + (paymentResult.error || 'Unknown error'));
                }
                
            } catch (error) {
                console.error('Payment processing error:', error);
                alert('❌ Payment failed: ' + error.message);
            } finally {
                // Reset button state
                if (submitButton && buttonText && spinner) {
                    submitButton.disabled = false;
                    buttonText.textContent = 'Complete Payment';
                    spinner.classList.add('hidden');
                }
            }
        });
    }
    
    // Setup payment method listeners initially (for the HTML content)
    setupPaymentMethodListeners();
});

// Handle mobile banking payment flow
function handleMobileBankingPayment(paymentResult, method) {
    const paymentId = paymentResult.payment_id;
    const instructions = paymentResult.instructions;
    
    // Show payment instructions modal or update UI
    const instructionsHtml = `
        <div class="payment-modal">
            <div class="payment-modal-content">
                <h3>Complete ${method.toUpperCase()} Payment</h3>
                <div class="payment-instructions">
                    <p><strong>Amount:</strong> ${instructions.amount}</p>
                    <p><strong>Reference:</strong> StudySync-${paymentId}</p>
                    <ol>
                        <li>Open your ${method} app or dial the USSD code</li>
                        <li>Send money to: <strong>${instructions.merchant_number || '01XXXXXXXXX'}</strong></li>
                        <li>Amount: <strong>${instructions.amount}</strong></li>
                        <li>Reference: <strong>StudySync-${paymentId}</strong></li>
                        <li>Complete the payment and get Transaction ID</li>
                        <li>Enter the Transaction ID below and click verify</li>
                    </ol>
                </div>
                <div class="verification-form">
                    <input type="text" id="verify-transaction-id" placeholder="Enter Transaction ID" />
                    <button onclick="verifyMobilePayment('${paymentId}')" class="btn btn-primary">
                        Verify Payment
                    </button>
                </div>
                <button onclick="closePaymentModal()" class="btn btn-secondary">Cancel</button>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', instructionsHtml);
}

// Verify mobile payment
async function verifyMobilePayment(paymentId) {
    const transactionId = document.getElementById('verify-transaction-id')?.value;
    
    if (!transactionId) {
        alert('❌ Please enter the Transaction ID');
        return;
    }
    
    try {
        const result = await verifyPayment(paymentId, transactionId);
        
        if (result.success) {
            alert('🎉 Payment verified successfully!\n\n✅ Premium subscription activated\n✅ All features unlocked\n\nWelcome to StudySync Premium!');
            closePaymentModal();
            window.location.href = 'index.html';
        } else {
            alert('❌ Payment verification failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('❌ Verification failed: ' + error.message);
    }
}

// Close payment modal
function closePaymentModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.remove();
    }
}

// Update mobile banking instructions
async function updateMobileBankingInstructions(method) {
    const instructionsElement = document.getElementById('payment-instructions');
    const titleElement = document.getElementById('mobile-banking-title');
    
    if (!instructionsElement || !titleElement) return;
    
    try {
        // Get payment instructions from backend
        const response = await apiRequest(`/payments/instructions/?method=${method}&amount=299&currency=BDT`);
        
        if (response.instructions) {
            const instructions = response.instructions;
            titleElement.textContent = `${instructions.method} Payment Instructions`;
            
            instructionsElement.innerHTML = `
                <div class="payment-instructions">
                    <h5>📱 How to pay with ${instructions.method}:</h5>
                    <div class="payment-details">
                        <p><strong>Amount:</strong> ${instructions.amount}</p>
                        <p><strong>Merchant Number:</strong> ${instructions.account_details?.account_number || '01XXXXXXXXX'}</p>
                        <p><strong>Reference:</strong> StudySync Premium</p>
                    </div>
                    <ol>
                        ${instructions.instructions.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            `;
        } else {
            // Fallback to default instructions
            setDefaultInstructions(method, instructionsElement, titleElement);
        }
    } catch (error) {
        console.error('Error loading payment instructions:', error);
        // Fallback to default instructions
        setDefaultInstructions(method, instructionsElement, titleElement);
    }
}

// Set default payment instructions (fallback)
function setDefaultInstructions(method, instructionsElement, titleElement) {
    let instructions = '';
    let title = '';
    
    switch (method) {
        case 'bkash':
            title = 'bKash Payment Instructions';
            instructions = `
                <div class="payment-instructions">
                    <h5>📱 How to pay with bKash:</h5>
                    <div class="payment-details">
                        <p><strong>Amount:</strong> ৳299</p>
                        <p><strong>Merchant Number:</strong> 01XXXXXXXXX</p>
                        <p><strong>Reference:</strong> StudySync Premium</p>
                    </div>
                    <ol>
                        <li>Dial *247# from your bKash registered mobile</li>
                        <li>Select "Payment" option</li>
                        <li>Enter Merchant Number: <strong>01XXXXXXXXX</strong></li>
                        <li>Enter Amount: <strong>৳299</strong></li>
                        <li>Enter Reference: <strong>StudySync Premium</strong></li>
                        <li>Enter your PIN and confirm</li>
                        <li>Copy the Transaction ID and paste below</li>
                    </ol>
                </div>
            `;
            break;
        case 'nagad':
            title = 'Nagad Payment Instructions';
            instructions = `
                <div class="payment-instructions">
                    <h5>📱 How to pay with Nagad:</h5>
                    <div class="payment-details">
                        <p><strong>Amount:</strong> ৳299</p>
                        <p><strong>Merchant Number:</strong> 01XXXXXXXXX</p>
                        <p><strong>Reference:</strong> StudySync Premium</p>
                    </div>
                    <ol>
                        <li>Dial *167# from your Nagad registered mobile</li>
                        <li>Select "Payment" option</li>
                        <li>Enter Merchant Number: <strong>01XXXXXXXXX</strong></li>
                        <li>Enter Amount: <strong>৳299</strong></li>
                        <li>Enter Reference: <strong>StudySync Premium</strong></li>
                        <li>Enter your PIN and confirm</li>
                        <li>Copy the Transaction ID and paste below</li>
                    </ol>
                </div>
            `;
            break;
    }
    
    titleElement.textContent = title;
    instructionsElement.innerHTML = instructions;
}
