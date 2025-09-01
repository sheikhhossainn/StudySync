// StudySync Configuration
const StudySyncConfig = {
    // API Configuration
    API_BASE_URL: (() => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000'; // Django backend
        }
        // Production
        return 'https://study-sync-teal.vercel.app';
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
