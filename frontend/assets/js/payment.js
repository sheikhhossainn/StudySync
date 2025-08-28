// Payment Page JavaScript with Stripe Integration

// Initialize Stripe - Replace with your publishable key
const stripe = Stripe('pk_test_51234567890abcdef...'); // Replace with your actual Stripe publishable key
const elements = stripe.elements();

// Payment state
let selectedPaymentType = null;
let paymentAmount = 0;
let mentorInfo = null;

// Stripe card element
let card = null;

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentPage();
});

function initializePaymentPage() {
    // Setup Stripe Elements
    setupStripeElements();
    
    // Add payment method change listeners
    const paymentMethodInputs = document.querySelectorAll('input[name="payment-method"]');
    paymentMethodInputs.forEach(input => {
        input.addEventListener('change', handlePaymentMethodChange);
    });
    
    // Add form validation
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmission);
    }

    // Add mentor selection validation
    const mentorSelect = document.getElementById('mentor-select');
    const mentorAmount = document.getElementById('mentor-amount');
    
    if (mentorSelect && mentorAmount) {
        mentorSelect.addEventListener('change', updateMentorPaymentValidation);
        mentorAmount.addEventListener('input', updateMentorPaymentValidation);
    }

    // Add mobile number formatting
    const mobileNumberInput = document.getElementById('mobile-number');
    if (mobileNumberInput) {
        mobileNumberInput.addEventListener('input', formatMobileNumber);
    }
}

// Handle payment method change
function handlePaymentMethodChange() {
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const cardDetails = document.getElementById('card-details');
    const mobileBankingDetails = document.getElementById('mobile-banking-details');
    const mobileBankingTitle = document.getElementById('mobile-banking-title');
    
    // Hide all payment method sections
    cardDetails.style.display = 'none';
    mobileBankingDetails.style.display = 'none';
    
    if (selectedMethod === 'card') {
        cardDetails.style.display = 'block';
    } else if (['bkash', 'nagad', 'rocket'].includes(selectedMethod)) {
        mobileBankingDetails.style.display = 'block';
        updateMobileBankingInstructions(selectedMethod);
        mobileBankingTitle.textContent = `${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} Payment Details`;
    } else if (selectedMethod === 'cod-card') {
        // Card on Delivery - no additional details needed
        // Could show delivery instructions here if needed
    }
}

// Update mobile banking instructions based on selected method
function updateMobileBankingInstructions(method) {
    const paymentInstructions = document.getElementById('payment-instructions');
    const total = selectedPaymentType === 'remove-ads' 
        ? (paymentAmount + 0.30)
        : (paymentAmount + Math.max(0.30, paymentAmount * 0.029));
    
    let instructions = '';
    let paymentNumber = '';
    
    switch (method) {
        case 'bkash':
            paymentNumber = '01700000000'; // Replace with actual bKash merchant number
            instructions = `
                <h5>bKash Payment Instructions</h5>
                <div class="payment-steps">
                    <div class="payment-step">Dial *247# from your mobile or use bKash app</div>
                    <div class="payment-step">Select "Send Money" option</div>
                    <div class="payment-step">Enter merchant number: <span class="payment-number">${paymentNumber}</span></div>
                    <div class="payment-step">Enter amount: <span class="payment-amount-highlight">৳${(total * 85).toFixed(2)}</span></div>
                    <div class="payment-step">Enter your bKash mobile menu PIN</div>
                    <div class="payment-step">Copy the transaction ID and enter below</div>
                </div>
            `;
            break;
        case 'nagad':
            paymentNumber = '01800000000'; // Replace with actual Nagad merchant number
            instructions = `
                <h5>Nagad Payment Instructions</h5>
                <div class="payment-steps">
                    <div class="payment-step">Dial *167# from your mobile or use Nagad app</div>
                    <div class="payment-step">Select "Send Money" option</div>
                    <div class="payment-step">Enter merchant number: <span class="payment-number">${paymentNumber}</span></div>
                    <div class="payment-step">Enter amount: <span class="payment-amount-highlight">৳${(total * 85).toFixed(2)}</span></div>
                    <div class="payment-step">Enter your Nagad PIN</div>
                    <div class="payment-step">Copy the transaction ID and enter below</div>
                </div>
            `;
            break;
        case 'rocket':
            paymentNumber = '01900000000'; // Replace with actual Rocket merchant number
            instructions = `
                <h5>Rocket Payment Instructions</h5>
                <div class="payment-steps">
                    <div class="payment-step">Dial *322# from your mobile or use Rocket app</div>
                    <div class="payment-step">Select "Send Money" option</div>
                    <div class="payment-step">Enter merchant number: <span class="payment-number">${paymentNumber}</span></div>
                    <div class="payment-step">Enter amount: <span class="payment-amount-highlight">৳${(total * 85).toFixed(2)}</span></div>
                    <div class="payment-step">Enter your Rocket PIN</div>
                    <div class="payment-step">Copy the transaction ID and enter below</div>
                </div>
            `;
            break;
    }
    
    paymentInstructions.innerHTML = instructions;
}

// Format mobile number input
function formatMobileNumber(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 11 digits for Bangladesh mobile numbers
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    // Format as 01X-XXXX-XXXX
    if (value.length > 3 && value.length <= 7) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    } else if (value.length > 7) {
        value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
    }
    
    e.target.value = value;
}

// Setup Stripe Elements
function setupStripeElements() {
    // Create card element
    card = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#374151',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                '::placeholder': {
                    color: '#9ca3af',
                },
            },
            invalid: {
                color: '#dc2626',
                iconColor: '#dc2626'
            }
        }
    });

    // Mount card element
    card.mount('#card-element');

    // Handle real-time validation errors from the card Element
    card.on('change', ({error}) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
            displayError.textContent = error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

// Initiate Ad Removal Payment
async function initiateAdRemovalPayment() {
    selectedPaymentType = 'remove-ads';
    paymentAmount = 4.99;
    
    // Show payment form
    showPaymentForm('Remove Advertisements');
    generatePaymentSummary();
}

// Initiate Mentor Payment
async function initiateMentorPayment() {
    const mentorSelect = document.getElementById('mentor-select');
    const mentorAmount = document.getElementById('mentor-amount');
    
    // Validate inputs
    if (!mentorSelect.value) {
        showMessage('Please select a mentor', 'error');
        return;
    }
    
    if (!mentorAmount.value || parseFloat(mentorAmount.value) <= 0) {
        showMessage('Please enter a valid payment amount', 'error');
        return;
    }

    selectedPaymentType = 'mentor-payment';
    paymentAmount = parseFloat(mentorAmount.value);
    mentorInfo = {
        id: mentorSelect.value,
        name: mentorSelect.options[mentorSelect.selectedIndex].text,
        description: document.getElementById('session-description').value
    };
    
    // Show payment form
    showPaymentForm('Pay Your Mentor');
    generatePaymentSummary();
}

// Show payment form with animation
function showPaymentForm(title) {
    const formContainer = document.getElementById('payment-form-container');
    const formTitle = document.getElementById('form-title');
    
    formTitle.textContent = `Complete Payment - ${title}`;
    
    // Show form with animation
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Generate payment summary
function generatePaymentSummary() {
    const summaryContainer = document.getElementById('payment-summary');
    let summaryHTML = '';
    
    if (selectedPaymentType === 'remove-ads') {
        const processingFee = 0.30;
        const total = paymentAmount + processingFee;
        
        summaryHTML = `
            <div class="summary-item">
                <span class="summary-label">Ad-Free Subscription (Monthly)</span>
                <span class="summary-value">$${paymentAmount.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Processing Fee</span>
                <span class="summary-value">$${processingFee.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Amount</span>
                <span class="summary-value">$${total.toFixed(2)}</span>
            </div>
        `;
    } else if (selectedPaymentType === 'mentor-payment') {
        const processingFee = Math.max(0.30, paymentAmount * 0.029); // 2.9% + $0.30
        const total = paymentAmount + processingFee;
        
        summaryHTML = `
            <div class="summary-item">
                <span class="summary-label">Mentor</span>
                <span class="summary-value">${mentorInfo.name}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Payment Amount</span>
                <span class="summary-value">$${paymentAmount.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Processing Fee</span>
                <span class="summary-value">$${processingFee.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Amount</span>
                <span class="summary-value">$${total.toFixed(2)}</span>
            </div>
        `;
    }
    
    summaryContainer.innerHTML = summaryHTML;
}

// Handle payment form submission
async function handlePaymentSubmission(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.classList.add('processing');
    buttonText.textContent = 'Processing...';
    spinner.classList.remove('hidden');
    
    try {
        // Validate billing information
        if (!validateBillingInfo()) {
            throw new Error('Please fill in all required information');
        }
        
        if (selectedMethod === 'card') {
            // Handle Stripe card payment
            await handleCardPayment();
        } else if (['bkash', 'nagad', 'rocket'].includes(selectedMethod)) {
            // Handle mobile banking payment
            await handleMobileBankingPayment(selectedMethod);
        } else if (selectedMethod === 'cod-card') {
            // Handle Card on Delivery
            await handleCardOnDelivery();
        }
        
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.classList.remove('processing');
        buttonText.textContent = 'Complete Payment';
        spinner.classList.add('hidden');
    }
}

// Handle card payment through Stripe
async function handleCardPayment() {
    // Create payment intent on server
    const paymentIntent = await createPaymentIntent();
    
    // Confirm payment with Stripe
    const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: {
            card: card,
            billing_details: getBillingDetails()
        }
    });
    
    if (result.error) {
        throw new Error(result.error.message);
    } else {
        // Payment succeeded
        await handleSuccessfulPayment(result.paymentIntent);
    }
}

// Handle mobile banking payment
async function handleMobileBankingPayment(method) {
    switch (method) {
        case 'bkash':
            await handleBkashPayment();
            break;
        case 'nagad':
            await handleNagadPayment();
            break;
        case 'rocket':
            await handleRocketPayment();
            break;
        default:
            throw new Error('Unsupported payment method');
    }
}

// bKash Payment Integration
async function handleBkashPayment() {
    try {
        const bkashConfig = {
            paymentMode: 'checkout',
            paymentRequest: {
                amount: (paymentAmount * 85).toFixed(2), // Convert USD to BDT
                intent: 'sale',
                merchantInvoiceNumber: 'SS' + Date.now(),
                currency: 'BDT',
                merchantAssociationInfo: 'StudySync Payment'
            },
            createRequest: async function(request) {
                // Create payment on your server
                const response = await fetch('/api/bkash/create-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: request.amount,
                        invoice: request.merchantInvoiceNumber,
                        customer_details: getBillingDetails(),
                        payment_type: selectedPaymentType,
                        mentor_info: mentorInfo
                    })
                });
                return await response.json();
            },
            executeRequestOnAuthorization: async function(request) {
                // Execute payment on your server
                const response = await fetch('/api/bkash/execute-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentID: request.paymentID
                    })
                });
                return await response.json();
            }
        };

        // Initialize bKash checkout
        if (typeof bKash !== 'undefined') {
            bKash.init(bkashConfig);
            bKash.create().onSuccess = function(data) {
                if (data && data.paymentID) {
                    bKash.execute(data.paymentID);
                } else {
                    throw new Error('bKash payment creation failed');
                }
            };
            
            bKash.execute().onSuccess = function(data) {
                if (data && data.paymentID) {
                    handleSuccessfulPayment({
                        id: data.paymentID,
                        status: 'completed',
                        payment_method: 'bkash',
                        transaction_id: data.trxID
                    });
                } else {
                    throw new Error('bKash payment execution failed');
                }
            };
            
            bKash.create().onClose = function() {
                throw new Error('Payment cancelled by user');
            };
        } else {
            // Fallback to manual bKash payment
            await handleManualMobileBankingPayment('bkash');
        }
    } catch (error) {
        console.error('bKash payment error:', error);
        throw error;
    }
}

// Nagad Payment Integration
async function handleNagadPayment() {
    try {
        const nagadConfig = {
            clientId: 'YOUR_NAGAD_CLIENT_ID', // Replace with your actual client ID
            amount: (paymentAmount * 85).toFixed(2), // Convert USD to BDT
            orderId: 'SS-NGD-' + Date.now(),
            currency: 'BDT',
            challenge: generateRandomString(40)
        };

        // Initialize Nagad checkout
        if (typeof NagadCheckout !== 'undefined') {
            const nagadCheckout = new NagadCheckout({
                baseURL: 'https://api.mynagad.com/api/dfs/check-out/v1',
                merchantId: 'YOUR_NAGAD_MERCHANT_ID', // Replace with your merchant ID
                orderId: nagadConfig.orderId,
                amount: nagadConfig.amount,
                successCallback: function(data) {
                    handleSuccessfulPayment({
                        id: data.payment_ref_id,
                        status: 'completed',
                        payment_method: 'nagad',
                        transaction_id: data.payment_ref_id
                    });
                },
                failureCallback: function(data) {
                    throw new Error(data.status_message || 'Nagad payment failed');
                },
                cancelledCallback: function(data) {
                    throw new Error('Payment cancelled by user');
                }
            });
            
            nagadCheckout.proceed();
        } else {
            // Fallback to manual Nagad payment
            await handleManualMobileBankingPayment('nagad');
        }
    } catch (error) {
        console.error('Nagad payment error:', error);
        throw error;
    }
}

// Rocket Payment Integration
async function handleRocketPayment() {
    try {
        const rocketConfig = {
            merchantId: 'YOUR_ROCKET_MERCHANT_ID', // Replace with your merchant ID
            amount: (paymentAmount * 85).toFixed(2), // Convert USD to BDT
            orderId: 'SS-RKT-' + Date.now(),
            currency: 'BDT',
            description: selectedPaymentType === 'remove-ads' ? 'Remove Ads Subscription' : 'Mentor Payment'
        };

        // Initialize Rocket checkout
        if (typeof RocketCheckout !== 'undefined') {
            const rocketCheckout = new RocketCheckout({
                merchantId: rocketConfig.merchantId,
                amount: rocketConfig.amount,
                orderId: rocketConfig.orderId,
                successUrl: window.location.origin + '/payment-success',
                failUrl: window.location.origin + '/payment-failed',
                cancelUrl: window.location.origin + '/payment-cancelled',
                onSuccess: function(data) {
                    handleSuccessfulPayment({
                        id: data.transactionId,
                        status: 'completed',
                        payment_method: 'rocket',
                        transaction_id: data.transactionId
                    });
                },
                onError: function(error) {
                    throw new Error(error.message || 'Rocket payment failed');
                },
                onCancel: function() {
                    throw new Error('Payment cancelled by user');
                }
            });
            
            rocketCheckout.pay();
        } else {
            // Fallback to manual Rocket payment
            await handleManualMobileBankingPayment('rocket');
        }
    } catch (error) {
        console.error('Rocket payment error:', error);
        throw error;
    }
}

// Manual mobile banking payment (fallback)
async function handleManualMobileBankingPayment(method) {
    const mobileNumber = document.getElementById('mobile-number').value;
    const transactionId = document.getElementById('transaction-id').value;
    const referenceNote = document.getElementById('reference-note').value;
    
    if (!mobileNumber || !transactionId) {
        throw new Error('Please provide mobile number and transaction ID');
    }
    
    // Create mobile banking payment record
    const paymentData = {
        payment_type: selectedPaymentType,
        payment_method: method,
        amount: paymentAmount,
        mobile_number: mobileNumber,
        transaction_id: transactionId,
        reference_note: referenceNote,
        customer_details: getBillingDetails(),
        mentor_info: mentorInfo
    };
    
    // Send to server for verification
    const result = await processMobileBankingPayment(paymentData);
    
    if (result.success) {
        await handleSuccessfulPayment(result);
    } else {
        throw new Error(result.error || 'Payment processing failed');
    }
}

// Handle card on delivery payment
async function handleCardOnDelivery() {
    const paymentData = {
        payment_type: selectedPaymentType,
        payment_method: 'cod-card',
        amount: paymentAmount,
        customer_details: getBillingDetails(),
        mentor_info: mentorInfo,
        delivery_instructions: 'Card payment on delivery'
    };
    
    // Process Card on Delivery order
    const result = await processCardOnDelivery(paymentData);
    
    if (result.success) {
        await handleSuccessfulPayment(result);
    } else {
        throw new Error(result.error || 'Order processing failed');
    }
}

// Process Card on Delivery order (mock implementation)
async function processCardOnDelivery(paymentData) {
    console.log('Processing Card on Delivery order:', paymentData);
    
    // Mock order processing
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                id: 'cod_' + Date.now(),
                order_number: 'ORD-' + Date.now(),
                status: 'confirmed',
                delivery_status: 'pending'
            });
        }, 1500);
    });
}

// Process mobile banking payment (mock implementation)
async function processMobileBankingPayment(paymentData) {
    // In a real application, this would verify the transaction with the mobile banking provider
    console.log('Processing mobile banking payment:', paymentData);
    
    // Mock verification process
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful verification
            resolve({
                success: true,
                id: 'mb_' + Date.now(),
                transaction_id: paymentData.transaction_id,
                status: 'completed'
            });
        }, 2000);
    });
}

// Create payment intent on server (mock implementation)
async function createPaymentIntent() {
    // In a real application, this would make a request to your backend
    // This is a mock implementation
    const total = selectedPaymentType === 'remove-ads' 
        ? (paymentAmount + 0.30) * 100 // Convert to cents
        : (paymentAmount + Math.max(0.30, paymentAmount * 0.029)) * 100;
    
    // Mock server response
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                client_secret: 'pi_mock_client_secret_' + Date.now(),
                amount: Math.round(total),
                currency: 'usd'
            });
        }, 1000);
    });
}

// Get billing details from form
function getBillingDetails() {
    return {
        name: document.getElementById('billing-name').value,
        email: document.getElementById('billing-email').value,
        address: {
            line1: document.getElementById('billing-address').value,
            city: document.getElementById('billing-city').value,
            state: document.getElementById('billing-state').value,
            postal_code: document.getElementById('billing-zip').value,
            country: 'US'
        }
    };
}

// Validate billing information
function validateBillingInfo() {
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const requiredFields = ['billing-email', 'billing-name', 'billing-address', 'billing-city', 'billing-state', 'billing-zip'];
    let isValid = true;
    
    // Check terms agreement
    const termsCheckbox = document.getElementById('terms-agreement');
    if (!termsCheckbox.checked) {
        showMessage('Please agree to the Terms & Conditions', 'error');
        isValid = false;
    }
    
    // Add mobile banking specific validation
    if (['bkash', 'nagad', 'rocket'].includes(selectedMethod)) {
        requiredFields.push('mobile-number', 'transaction-id');
        
        // Validate mobile number format
        const mobileNumber = document.getElementById('mobile-number').value.replace(/\D/g, '');
        if (mobileNumber.length !== 11 || !mobileNumber.startsWith('01')) {
            document.getElementById('mobile-number').style.borderColor = '#dc2626';
            showMessage('Please enter a valid Bangladesh mobile number (11 digits starting with 01)', 'error');
            isValid = false;
        } else {
            document.getElementById('mobile-number').style.borderColor = '#d1d5db';
        }
        
        // Validate transaction ID
        const transactionId = document.getElementById('transaction-id').value;
        if (transactionId.length < 8) {
            document.getElementById('transaction-id').style.borderColor = '#dc2626';
            showMessage('Please enter a valid transaction ID', 'error');
            isValid = false;
        } else {
            document.getElementById('transaction-id').style.borderColor = '#d1d5db';
        }
    }
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.style.borderColor = '#dc2626';
            isValid = false;
        } else if (field) {
            field.style.borderColor = '#d1d5db';
        }
    });
    
    // Validate email format
    const emailField = document.getElementById('billing-email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
        emailField.style.borderColor = '#dc2626';
        isValid = false;
    }
    
    return isValid;
}

// Handle successful payment
async function handleSuccessfulPayment(paymentIntent) {
    showMessage('Payment successful! Processing your request...', 'success');
    
    // Send payment confirmation to server
    await sendPaymentConfirmation(paymentIntent);
    
    // Redirect based on payment type
    setTimeout(() => {
        if (selectedPaymentType === 'remove-ads') {
            window.location.href = 'index.html?ads=removed&payment=success';
        } else {
            window.location.href = 'mentorship.html?payment=completed&mentor=' + encodeURIComponent(mentorInfo.id);
        }
    }, 2000);
}

// Send payment confirmation to server (mock implementation)
async function sendPaymentConfirmation(paymentIntent) {
    // In a real application, this would send payment details to your backend
    const confirmationData = {
        payment_intent_id: paymentIntent.id,
        payment_type: selectedPaymentType,
        amount: paymentAmount,
        customer_details: getBillingDetails(),
        mentor_info: mentorInfo
    };
    
    console.log('Payment confirmation data:', confirmationData);
    
    // Mock server request
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 500);
    });
}

// Update mentor payment validation
function updateMentorPaymentValidation() {
    const mentorSelect = document.getElementById('mentor-select');
    const mentorAmount = document.getElementById('mentor-amount');
    const selectButton = document.querySelector('[data-payment-type="mentor-payment"] .btn-select');
    
    if (mentorSelect && mentorAmount && selectButton) {
        if (mentorSelect.value && mentorAmount.value && parseFloat(mentorAmount.value) > 0) {
            selectButton.disabled = false;
            selectButton.style.opacity = '1';
        } else {
            selectButton.disabled = true;
            selectButton.style.opacity = '0.6';
        }
    }
}

// Go back to payment options
function goBack() {
    const formContainer = document.getElementById('payment-form-container');
    formContainer.style.display = 'none';
    
    // Clear payment state
    selectedPaymentType = null;
    paymentAmount = 0;
    mentorInfo = null;
    
    // Clear form
    document.getElementById('payment-form').reset();
    card.clear();
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show message to user
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert message at the top of the form container
    const formContainer = document.getElementById('payment-form-container');
    if (formContainer.style.display !== 'none') {
        const formCard = formContainer.querySelector('.payment-form-card');
        formCard.insertBefore(messageDiv, formCard.firstChild);
    } else {
        // Insert message at the top of the payment wrapper
        const paymentWrapper = document.querySelector('.payment-wrapper');
        paymentWrapper.insertBefore(messageDiv, paymentWrapper.firstChild);
    }
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Utility function to generate random string
function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

// Mobile Banking API Configuration
const MOBILE_BANKING_CONFIG = {
    bkash: {
        baseUrl: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
        username: 'YOUR_BKASH_USERNAME', // Replace with actual credentials
        password: 'YOUR_BKASH_PASSWORD',
        appKey: 'YOUR_BKASH_APP_KEY',
        appSecret: 'YOUR_BKASH_APP_SECRET'
    },
    nagad: {
        baseUrl: 'https://api.mynagad.com/api/dfs/check-out/v1',
        merchantId: 'YOUR_NAGAD_MERCHANT_ID',
        publicKey: 'YOUR_NAGAD_PUBLIC_KEY',
        privateKey: 'YOUR_NAGAD_PRIVATE_KEY'
    },
    rocket: {
        baseUrl: 'https://rocket.com.bd/api',
        merchantId: 'YOUR_ROCKET_MERCHANT_ID',
        apiKey: 'YOUR_ROCKET_API_KEY',
        secretKey: 'YOUR_ROCKET_SECRET_KEY'
    }
};

// Server-side API endpoints (these should be implemented on your backend)
const API_ENDPOINTS = {
    bkash: {
        createPayment: '/api/bkash/create-payment',
        executePayment: '/api/bkash/execute-payment',
        queryPayment: '/api/bkash/query-payment'
    },
    nagad: {
        initPayment: '/api/nagad/init-payment',
        completePayment: '/api/nagad/complete-payment',
        verifyPayment: '/api/nagad/verify-payment'
    },
    rocket: {
        initiatePayment: '/api/rocket/initiate-payment',
        confirmPayment: '/api/rocket/confirm-payment',
        checkStatus: '/api/rocket/check-status'
    }
};
