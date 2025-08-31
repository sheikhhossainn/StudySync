// StudySync Google OAuth 2.0 Integration
// Configuration
const API_BASE_URL = 'http://localhost:8000'; // Change to your Vercel API URL in production
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // Replace with your Google Client ID

// Initialize Google OAuth when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeGoogleAuth();
});

function initializeGoogleAuth() {
    // Update the client ID in the HTML
    const googleOnload = document.getElementById('g_id_onload');
    if (googleOnload) {
        googleOnload.setAttribute('data-client_id', GOOGLE_CLIENT_ID);
    }
    
    console.log('Google OAuth initialized');
}

// Handle Google Sign-In Response
function handleGoogleSignIn(response) {
    console.log('Google Sign-In Response:', response);
    
    if (response.credential) {
        // Send the credential to your backend
        authenticateWithGoogle(response.credential);
    } else {
        console.error('No credential received from Google');
        showError('Google authentication failed. Please try again.');
    }
}

// Authenticate with Google OAuth
async function authenticateWithGoogle(credential) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/accounts/auth/google/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                credential: credential
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Authentication successful
            console.log('Google authentication successful:', data);
            
            // Store JWT tokens
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            // Show success message
            showSuccess('Login successful! Redirecting...');
            
            // Redirect to dashboard or profile
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Change to your dashboard URL
            }, 2000);
            
        } else {
            // Authentication failed
            console.error('Google authentication failed:', data);
            showError(data.error || 'Authentication failed. Please try again.');
        }
        
    } catch (error) {
        console.error('Error during Google authentication:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}

// Custom Email/Password Login
async function customLogin(email, password) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/accounts/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful
            console.log('Login successful:', data);
            
            // Store JWT tokens
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } else {
            console.error('Login failed:', data);
            showError(data.error || 'Login failed. Please check your credentials.');
        }
        
    } catch (error) {
        console.error('Error during login:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}

// Custom Registration
async function customRegister(email, password, firstName, lastName) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/accounts/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                email: email,
                password: password,
                first_name: firstName,
                last_name: lastName
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Registration successful
            console.log('Registration successful:', data);
            
            // Store JWT tokens
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            showSuccess('Registration successful! Welcome to StudySync!');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } else {
            console.error('Registration failed:', data);
            showError(data.error || 'Registration failed. Please try again.');
        }
        
    } catch (error) {
        console.error('Error during registration:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}

// Refresh JWT Token
async function refreshToken() {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/accounts/auth/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRfToken': getCsrfToken()
            },
            body: JSON.stringify({
                refresh: refreshToken
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update access token
            localStorage.setItem('access_token', data.access);
            return data.access;
        } else {
            // Refresh failed, redirect to login
            localStorage.clear();
            window.location.href = 'auth.html';
            return null;
        }
        
    } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.clear();
        window.location.href = 'auth.html';
        return null;
    }
}

// Logout
async function logout() {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
            await fetch(`${API_BASE_URL}/api/accounts/auth/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            });
        }
        
        // Clear local storage
        localStorage.clear();
        
        // Redirect to login page
        window.location.href = 'auth.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.clear();
        window.location.href = 'auth.html';
    }
}

// Utility Functions
function getCsrfToken() {
    // Get CSRF token from cookies or meta tag
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Add to page
    const authCard = document.getElementById('step1');
    if (authCard) {
        authCard.insertBefore(messageElement, authCard.firstChild);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Check if user is authenticated
function isAuthenticated() {
    const accessToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    return accessToken && userData;
}

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

// Make authenticated API requests
async function makeAuthenticatedRequest(url, options = {}) {
    let accessToken = localStorage.getItem('access_token');
    
    // Try the request with current token
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    // If token expired, try to refresh
    if (response.status === 401) {
        accessToken = await refreshToken();
        if (accessToken) {
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    }
    
    return response;
}

// Export functions for use in other scripts
window.StudySyncAuth = {
    handleGoogleSignIn,
    customLogin,
    customRegister,
    logout,
    refreshToken,
    isAuthenticated,
    getCurrentUser,
    makeAuthenticatedRequest
};
