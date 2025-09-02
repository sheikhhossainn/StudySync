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
