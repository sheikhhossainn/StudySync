/**
 * StudySync Shared Authentication Utilities
 * Include this script on every page to handle user authentication state and avatar display
 */

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Debug: Log what's currently in localStorage
    console.log('🔍 LocalStorage Debug:');
    console.log('- access_token:', !!localStorage.getItem('access_token'));
    console.log('- user_data:', localStorage.getItem('user_data'));
    
    checkAuthStatusAndUpdateUI();
});

function checkAuthStatusAndUpdateUI() {
    const accessToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('🔍 Checking auth status...', { 
        hasToken: !!accessToken, 
        hasUserData: !!userData 
    });

    if (accessToken && userData) {
        // Check if userData has the profile info, if not it's old format
        try {
            const user = JSON.parse(userData);
            if (!user.profile) {
                console.log('⚠️ Old user data format detected - user should re-login for avatar to work properly');
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
        
        // User is logged in
        showUserAvatar(userData);
        
        // Hide login elements
        const loginBtn = document.getElementById('loginBtn');
        const staticLoginLink = document.querySelector('a[href="user-selection.html"]');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (staticLoginLink && !staticLoginLink.classList.contains('keep-visible')) {
            staticLoginLink.style.display = 'none';
        }
        
        // Show avatar section
        const userAvatarSection = document.getElementById('userAvatarSection');
        if (userAvatarSection) {
            userAvatarSection.style.display = 'block';
        } else {
            createAvatarSection();
        }
    } else {
        // User is not logged in
        showLoginElements();
        
        const userAvatarSection = document.getElementById('userAvatarSection');
        if (userAvatarSection) {
            userAvatarSection.style.display = 'none';
        }
    }
}

function showUserAvatar(userData) {
    try {
        const user = JSON.parse(userData);
        console.log('🔍 Raw user data from localStorage:', user);
        
        const avatarImg = document.getElementById('navUserAvatar');
        
        if (avatarImg) {
            setAvatarImage(avatarImg, user);
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
        console.log('Raw userData string:', userData);
    }
}

function setAvatarImage(avatarImg, user) {
    // Use the exact same logic as the working profile page
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    
    // Create default based on initials (same as profile page)
    const navDefaultAvatar = 'https://via.placeholder.com/40/3b82f6/ffffff?text=' + 
        encodeURIComponent((firstName[0] || '') + (lastName[0] || ''));
    
    // Check for profile picture in the exact same way as profile page
    let navAvatarSrc = navDefaultAvatar;
    
    // First check if user has profile object with profile_picture
    if (user.profile?.profile_picture) {
        navAvatarSrc = user.profile.profile_picture;
        console.log('✅ Gmail avatar loaded from user.profile.profile_picture:', navAvatarSrc);
    }
    // Then check direct user.profile_picture
    else if (user.profile_picture) {
        navAvatarSrc = user.profile_picture;
        console.log('✅ Gmail avatar loaded from user.profile_picture:', navAvatarSrc);
    }
    else {
        console.log('ℹ️ Using default avatar with initials:', (firstName[0] || '') + (lastName[0] || ''));
    }
    
    avatarImg.src = navAvatarSrc;
    avatarImg.alt = 'User Avatar';
    
    console.log('🔍 Avatar debug:', {
        user: user,
        hasProfile: !!user.profile,
        profilePicture: user.profile?.profile_picture,
        userProfilePicture: user.profile_picture,
        finalSrc: navAvatarSrc
    });
}

function showLoginElements() {
    const loginBtn = document.getElementById('loginBtn');
    const staticLoginLink = document.querySelector('a[href="user-selection.html"]');
    
    if (loginBtn) {
        loginBtn.style.display = 'inline-block';
    }
    if (staticLoginLink) {
        staticLoginLink.style.display = 'inline-block';
    }
}

function createAvatarSection() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    // Remove existing static login link (but keep ones with specific classes)
    const existingLoginLink = nav.querySelector('a[href="user-selection.html"]:not(.keep-visible)');
    if (existingLoginLink) {
        existingLoginLink.remove();
    }

    // Create avatar dropdown HTML
    const avatarHTML = `
        <div class="user-avatar-dropdown" id="userAvatarSection">
            <img id="navUserAvatar" src="https://via.placeholder.com/40/3b82f6/ffffff?text=U" alt="User Avatar" class="user-avatar" onclick="toggleDropdown()">
            <div id="userDropdown" class="dropdown-content">
                <a href="profile.html">👤 Profile Settings</a>
                <a href="#" onclick="logout()">🚪 Logout</a>
            </div>
        </div>
    `;

    // Insert avatar section at the end of nav
    nav.insertAdjacentHTML('beforeend', avatarHTML);
    
    // Load user data into the new avatar immediately
    const userData = localStorage.getItem('user_data');
    if (userData) {
        console.log('🔄 Loading avatar into newly created section...');
        showUserAvatar(userData);
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    console.log('🚪 User logged out');
    
    // Redirect to home page
    window.location.href = 'index.html';
}

function toggleDropdown() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const dropdown = document.getElementById("userDropdown");
    const avatar = document.getElementById("navUserAvatar");
    
    if (dropdown && !event.target.matches('.user-avatar') && !avatar?.contains(event.target)) {
        dropdown.classList.remove("show");
    }
});

// Export functions for use in other scripts
window.StudySyncSharedAuth = {
    checkAuthStatusAndUpdateUI,
    logout,
    toggleDropdown
};
