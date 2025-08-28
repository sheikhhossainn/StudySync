/**
 * OAuth 2.0 Authentication Service for StudySync
 * Handles Google, Facebook, and GitHub authentication
 */

class OAuth2Service {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000/api';
        this.clientId = null;
        this.redirectUri = window.location.origin + '/auth/callback';
        this.scopes = 'read write';
        
        // OAuth 2.0 providers configuration
        this.providers = {
            google: {
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
                clientId: '', // Set in initializeProvider
                scope: 'openid email profile'
            },
            facebook: {
                authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
                tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
                userInfoUrl: 'https://graph.facebook.com/v18.0/me',
                clientId: '', // Set in initializeProvider
                scope: 'email,public_profile'
            },
            github: {
                authUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                userInfoUrl: 'https://api.github.com/user',
                clientId: '', // Set in initializeProvider
                scope: 'user:email'
            }
        };

        // Initialize Google API
        this.initializeGoogleAPI();
        this.initializeFacebookSDK();
    }

    /**
     * Initialize Google OAuth 2.0 API
     */
    async initializeGoogleAPI() {
        try {
            // Load Google API script
            if (!window.google) {
                await this.loadScript('https://accounts.google.com/gsi/client');
            }

            // Initialize Google Identity Services
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: this.providers.google.clientId,
                    callback: this.handleGoogleCallback.bind(this),
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
            }
        } catch (error) {
            console.error('Error initializing Google API:', error);
        }
    }

    /**
     * Initialize Facebook SDK
     */
    initializeFacebookSDK() {
        // Load Facebook SDK
        window.fbAsyncInit = () => {
            FB.init({
                appId: this.providers.facebook.clientId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        };

        // Load Facebook SDK script
        if (!document.getElementById('facebook-jssdk')) {
            const js = document.createElement('script');
            js.id = 'facebook-jssdk';
            js.src = 'https://connect.facebook.net/en_US/sdk.js';
            document.head.appendChild(js);
        }
    }

    /**
     * Load external script
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Start OAuth 2.0 authorization flow
     */
    authorize(provider) {
        const config = this.providers[provider];
        if (!config) {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: config.scope,
            state: this.generateState(provider)
        });

        const authUrl = `${config.authUrl}?${params.toString()}`;
        window.location.href = authUrl;
    }

    /**
     * Handle Google Sign-In callback
     */
    handleGoogleCallback(credentialResponse) {
        this.handleSocialLogin('google', credentialResponse.credential);
    }

    /**
     * Google Sign-In
     */
    async signInWithGoogle() {
        try {
            if (!window.google || !window.google.accounts) {
                throw new Error('Google API not loaded');
            }

            // Show Google One Tap
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed()) {
                    console.log('Google One Tap not displayed');
                    // Fallback to popup
                    this.showGooglePopup();
                }
            });
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    /**
     * Show Google popup for sign-in
     */
    showGooglePopup() {
        if (window.google && window.google.accounts) {
            window.google.accounts.oauth2.initTokenClient({
                client_id: this.providers.google.clientId,
                scope: this.providers.google.scope,
                callback: (tokenResponse) => {
                    this.handleSocialLogin('google', tokenResponse.access_token);
                }
            }).requestAccessToken();
        }
    }

    /**
     * Facebook Sign-In
     */
    async signInWithFacebook() {
        return new Promise((resolve, reject) => {
            if (!window.FB) {
                reject(new Error('Facebook SDK not loaded'));
                return;
            }

            FB.login((response) => {
                if (response.authResponse) {
                    this.handleSocialLogin('facebook', response.authResponse.accessToken)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('Facebook login cancelled'));
                }
            }, { scope: this.providers.facebook.scope });
        });
    }

    /**
     * GitHub Sign-In
     */
    async signInWithGitHub() {
        this.authorize('github');
    }

    /**
     * Handle social login with backend
     */
    async handleSocialLogin(provider, accessToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/social/${provider}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: accessToken,
                    backend: provider
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Store tokens
            this.storeTokens(data.access_token, data.refresh_token);
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('profile', JSON.stringify(data.profile));

            // Trigger login event
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data }));

            return data;
        } catch (error) {
            console.error('Social login error:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
            throw new Error('Missing authorization code or state');
        }

        // Verify state
        const storedState = localStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter');
        }

        // Extract provider from state
        const provider = this.extractProviderFromState(state);
        
        // Exchange code for token
        return this.exchangeCodeForToken(provider, code);
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(provider, code) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/oauth/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: this.providers[provider].clientId,
                    redirect_uri: this.redirectUri
                })
            });

            if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Store tokens
            this.storeTokens(data.access_token, data.refresh_token);

            return data;
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/oauth/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Store new tokens
            this.storeTokens(data.access_token, data.refresh_token);

            return data.access_token;
        } catch (error) {
            console.error('Token refresh error:', error);
            // Clear invalid tokens
            this.logout();
            throw error;
        }
    }

    /**
     * Get current access token
     */
    getAccessToken() {
        return localStorage.getItem('access_token');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getAccessToken();
        if (!token) return false;

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(url, options = {}) {
        let token = this.getAccessToken();
        
        // Try to refresh token if expired
        if (!this.isAuthenticated()) {
            try {
                token = await this.refreshToken();
            } catch (error) {
                throw new Error('Authentication required');
            }
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token might be invalid, try refresh
            try {
                token = await this.refreshToken();
                headers['Authorization'] = `Bearer ${token}`;
                
                return fetch(url, {
                    ...options,
                    headers
                });
            } catch (error) {
                this.logout();
                throw new Error('Authentication required');
            }
        }

        return response;
    }

    /**
     * Store tokens
     */
    storeTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    /**
     * Generate state parameter
     */
    generateState(provider) {
        const state = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15) + 
                     '_' + provider;
        localStorage.setItem('oauth_state', state);
        return state;
    }

    /**
     * Extract provider from state
     */
    extractProviderFromState(state) {
        return state.split('_').pop();
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout endpoint if authenticated
            if (this.isAuthenticated()) {
                await this.apiRequest(`${this.apiBaseUrl}/auth/logout/`, {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('profile');
            localStorage.removeItem('oauth_state');

            // Trigger logout event
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
        }
    }

    /**
     * Get current user info
     */
    async getCurrentUser() {
        try {
            const response = await this.apiRequest(`${this.apiBaseUrl}/auth/oauth/user/`);
            
            if (!response.ok) {
                throw new Error(`Failed to get user info: ${response.status}`);
            }

            const userData = await response.json();
            
            // Update stored user data
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData.profile) {
                localStorage.setItem('profile', JSON.stringify(userData.profile));
            }

            return userData;
        } catch (error) {
            console.error('Get user info error:', error);
            throw error;
        }
    }

    /**
     * Initialize provider with client ID
     */
    initializeProvider(provider, clientId) {
        if (this.providers[provider]) {
            this.providers[provider].clientId = clientId;
        }
    }
}

// Export singleton instance
window.oauth2Service = new OAuth2Service();

export default window.oauth2Service;
