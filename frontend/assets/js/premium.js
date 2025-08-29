// Premium Membership JavaScript

// Show premium payment form
function showPremiumPayment() {
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
        
        // Update form title and summary
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
                        <span class="summary-label">👑 StudySync Premium</span>
                        <span class="summary-value">৳300/month</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">🎁 Free Trial</span>
                        <span class="summary-value">7 days</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-item summary-total">
                        <span class="summary-label">Total Today</span>
                        <span class="summary-value">৳0 (Free Trial)</span>
                    </div>
                    <div class="summary-note">
                        <p>✓ Your subscription will start after the 7-day free trial</p>
                        <p>✓ Cancel anytime before the trial ends to avoid charges</p>
                    </div>
                </div>
            `;
        }
        
        // Update submit button text
        const submitButton = document.getElementById('submit-payment');
        const buttonText = document.getElementById('button-text');
        if (buttonText) {
            buttonText.textContent = 'Start Premium Trial';
        }
        
        // Scroll to payment form
        paymentContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Start free trial
function startFreeTrial() {
    // Show confirmation
    if (confirm('🎉 Start your 7-day free trial of StudySync Premium?\n\n✓ Access all premium features immediately\n✓ No payment required for 7 days\n✓ Cancel anytime')) {
        // Simulate trial activation
        alert('🚀 Congratulations! Your 7-day free trial is now active!\n\n✨ You now have access to all premium features:\n• Ad-free experience\n• Unlimited posts & questions\n• Priority mentorship access\n• Advanced analytics\n• Unlimited file sharing\n• Premium themes\n\nEnjoy your premium experience!');
        
        // Redirect to dashboard or reload page
        window.location.href = 'index.html';
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

// Handle payment form submission
document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.getElementById('payment-form');
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get selected payment method
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
            
            // Show loading state
            const submitButton = document.getElementById('submit-payment');
            const buttonText = document.getElementById('button-text');
            const spinner = document.getElementById('spinner');
            
            if (submitButton && buttonText && spinner) {
                submitButton.disabled = true;
                buttonText.textContent = 'Processing...';
                spinner.classList.remove('hidden');
            }
            
            // Simulate payment processing
            setTimeout(() => {
                alert('🎉 Premium subscription activated successfully!\n\n✅ Payment processed\n✅ Premium features unlocked\n✅ Welcome to StudySync Premium!\n\nRedirecting to your dashboard...');
                
                // Redirect to dashboard
                window.location.href = 'index.html';
            }, 2000);
        });
    }
    
    // Handle payment method selection
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            const cardDetails = document.getElementById('card-details');
            const mobileBankingDetails = document.getElementById('mobile-banking-details');
            
            if (this.value === 'card') {
                if (cardDetails) cardDetails.style.display = 'block';
                if (mobileBankingDetails) mobileBankingDetails.style.display = 'none';
            } else {
                if (cardDetails) cardDetails.style.display = 'none';
                if (mobileBankingDetails) {
                    mobileBankingDetails.style.display = 'block';
                    updateMobileBankingInstructions(this.value);
                }
            }
        });
    });
});

// Update mobile banking instructions
function updateMobileBankingInstructions(method) {
    const instructionsElement = document.getElementById('payment-instructions');
    const titleElement = document.getElementById('mobile-banking-title');
    
    if (!instructionsElement || !titleElement) return;
    
    let instructions = '';
    let title = '';
    
    switch (method) {
        case 'bkash':
            title = 'bKash Payment Instructions';
            instructions = `
                <div class="payment-instructions">
                    <h5>📱 How to pay with bKash:</h5>
                    <ol>
                        <li>Dial *247# from your bKash registered mobile</li>
                        <li>Select "Payment" option</li>
                        <li>Enter Merchant Number: <strong>01XXXXXXXXX</strong></li>
                        <li>Enter Amount: <strong>৳300</strong></li>
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
                    <ol>
                        <li>Dial *167# from your Nagad registered mobile</li>
                        <li>Select "Payment" option</li>
                        <li>Enter Merchant Number: <strong>01XXXXXXXXX</strong></li>
                        <li>Enter Amount: <strong>৳300</strong></li>
                        <li>Enter Reference: <strong>StudySync Premium</strong></li>
                        <li>Enter your PIN and confirm</li>
                        <li>Copy the Transaction ID and paste below</li>
                    </ol>
                </div>
            `;
            break;
        case 'rocket':
            title = 'Rocket Payment Instructions';
            instructions = `
                <div class="payment-instructions">
                    <h5>📱 How to pay with Rocket:</h5>
                    <ol>
                        <li>Dial *322# from your Rocket registered mobile</li>
                        <li>Select "Payment" option</li>
                        <li>Enter Merchant Number: <strong>01XXXXXXXXX</strong></li>
                        <li>Enter Amount: <strong>৳300</strong></li>
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
