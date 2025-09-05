// StudySync API Service
// This file handles all API calls to the Django backend

class StudySyncAPI {
    constructor() {
        // Use dynamic API base URL from configuration
        this.baseURL = `${window.StudySyncConfig?.API_BASE_URL || 'http://localhost:8000'}/api`;
        this.token = localStorage.getItem('authToken');
    }

    // Get default headers for API requests
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }

        return headers;
    }

    // Handle API response
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    // Authentication APIs
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register/`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify(userData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login/`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify({ email, password })
            });
            const data = await this.handleResponse(response);
            
            if (data.token) {
                this.token = data.token;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.baseURL}/auth/logout/`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }

    // Profile APIs
    async getProfile() {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile/`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile/`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(profileData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    // Payment APIs
    async createBkashPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/payments/bkash/create-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('bKash payment creation error:', error);
            throw error;
        }
    }

    async executeBkashPayment(paymentID) {
        try {
            const response = await fetch(`${this.baseURL}/payments/bkash/execute-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ paymentID })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('bKash payment execution error:', error);
            throw error;
        }
    }

    async queryBkashPayment(paymentID) {
        try {
            const response = await fetch(`${this.baseURL}/payments/bkash/query-payment/${paymentID}/`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('bKash payment query error:', error);
            throw error;
        }
    }

    async initNagadPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/payments/nagad/init-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Nagad payment initialization error:', error);
            throw error;
        }
    }

    async completeNagadPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/payments/nagad/complete-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Nagad payment completion error:', error);
            throw error;
        }
    }

    async initiateRocketPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/payments/rocket/initiate-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Rocket payment initiation error:', error);
            throw error;
        }
    }

    async confirmRocketPayment(transactionId, otpCode) {
        try {
            const response = await fetch(`${this.baseURL}/payments/rocket/confirm-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ transaction_id: transactionId, otp_code: otpCode })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Rocket payment confirmation error:', error);
            throw error;
        }
    }

    async verifyManualPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/payments/verify-manual-payment/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Manual payment verification error:', error);
            throw error;
        }
    }

    // Study Sessions APIs
    async getStudySessions(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.baseURL}/sessions/?${queryParams}`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get study sessions error:', error);
            throw error;
        }
    }

    async createStudySession(sessionData) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(sessionData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Create study session error:', error);
            throw error;
        }
    }

    async getStudySession(sessionId) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get study session error:', error);
            throw error;
        }
    }

    async updateStudySession(sessionId, sessionData) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(sessionData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update study session error:', error);
            throw error;
        }
    }

    async deleteStudySession(sessionId) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('Delete study session error:', error);
            throw error;
        }
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearAuth() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }
}

// Create a global instance
window.studySyncAPI = new StudySyncAPI();
