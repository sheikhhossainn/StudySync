// StudySync Configuration
const StudySyncConfig = {
    // API Configuration
    API_BASE_URL: (() => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Force development mode if explicitly set
        if (window.location.search.includes('dev=true') || localStorage.getItem('forceDevMode') === 'true') {
            return 'http://localhost:8000';
        }
        
        // Development - detect local environment
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.0.')) {
            return 'http://localhost:8000'; // Django backend
        }
        
        // Live Server detection (common ports used by VS Code Live Server)
        if (port === '5500' || port === '55982' || port === '8080' || port === '3000') {
            return 'http://localhost:8000';
        }
        
        // Production - Use your deployed backend URL  
        return 'https://study-backend-delta.vercel.app';
    })(),
    
    // Google OAuth Configuration
    GOOGLE_CLIENT_ID: '1061988044539-0vq3h3fk08tjs9ncg63oetudgvt0onu8.apps.googleusercontent.com',
    
    // Feature Flags
    FEATURES: {
        GOOGLE_AUTH: true,
        FACEBOOK_AUTH: false,
        GITHUB_AUTH: false,
        EMAIL_VERIFICATION: true,
        PHONE_VERIFICATION: true
    }
};

// Export for use in other files
window.StudySyncConfig = StudySyncConfig;

// Development helpers
window.StudySyncDev = {
    // Force development mode
    enableDevMode: () => {
        localStorage.setItem('forceDevMode', 'true');
        location.reload();
    },
    
    // Force production mode (for testing)
    enableProdMode: () => {
        localStorage.removeItem('forceDevMode');
        location.reload();
    },
    
    // Show current configuration
    showConfig: () => {
        console.log('StudySync Configuration:', {
            API_BASE_URL: StudySyncConfig.API_BASE_URL,
            hostname: window.location.hostname,
            port: window.location.port,
            isDevMode: localStorage.getItem('forceDevMode') === 'true',
            features: StudySyncConfig.FEATURES
        });
    },
    
    // Test API connection
    testAPI: async () => {
        try {
            const response = await fetch(`${StudySyncConfig.API_BASE_URL}/api/`);
            console.log('API Test Result:', response.status, response.statusText);
            if (response.ok) {
                console.log('✅ API connection successful');
            } else {
                console.log('❌ API connection failed');
            }
        } catch (error) {
            console.log('❌ API connection error:', error.message);
        }
    }
};

// Authentication and User Management Functions
function checkUserRole() {
    const userRole = localStorage.getItem('userRole');
    const adminLink = document.getElementById('adminLink');
    
    // Show admin link only for admin users
    if (adminLink) {
        if (userRole === 'admin') {
            adminLink.style.display = 'inline-block';
        } else {
            adminLink.style.display = 'none';
        }
    }
}

// Initialize role check when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkUserRole();
    
    // Log configuration in development
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
        console.log('🔧 StudySync Development Mode');
        console.log('API URL:', StudySyncConfig.API_BASE_URL);
        console.log('Use StudySyncDev.showConfig() for detailed info');
        console.log('Use StudySyncDev.testAPI() to test connection');
    }
});

// Function to set user role (for testing purposes)
function setUserRole(role) {
    localStorage.setItem('userRole', role);
    checkUserRole();
}

// Function to simulate admin login (for testing)
function loginAsAdmin() {
    setUserRole('admin');
    console.log('Logged in as admin');
}

// Function to simulate regular user login (for testing)
function loginAsUser() {
    setUserRole('user');
    console.log('Logged in as regular user');
}
