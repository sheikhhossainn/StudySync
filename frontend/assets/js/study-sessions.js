// StudySync Study Sessions Management
class StudySessionsManager {
    constructor() {
        this.apiBaseUrl = window.StudySyncConfig?.API_BASE_URL || 'http://localhost:8000';
        this.currentPosts = [];
        this.filters = {
            subject: 'All',
            postType: 'All',
            difficulty: 'All'
        };
    }

    // Initialize the study sessions functionality
    init() {
        this.setupEventListeners();
        this.loadStudySessions();
    }

    setupEventListeners() {
        // Filter change listeners
        const subjectFilter = document.getElementById('subject');
        const timeFilter = document.getElementById('time');
        
        if (subjectFilter) {
            subjectFilter.addEventListener('change', () => this.applyFilters());
        }
        if (timeFilter) {
            timeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchPosts(e.target.value);
                }, 500);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshFeed');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadStudySessions());
        }
    }

    // Load study sessions with optional filters
    async loadStudySessions(filters = {}) {
        const sessionList = document.getElementById('sessionList');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        if (!sessionList) return;

        try {
            // Show loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (filters.subject && filters.subject !== 'All') {
                queryParams.append('subject_area', filters.subject);
            }
            if (filters.postType && filters.postType !== 'All') {
                queryParams.append('post_type', filters.postType);
            }
            if (filters.search) {
                queryParams.append('search', filters.search);
            }

            const url = `${this.apiBaseUrl}/api/study-sessions/posts/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            
            const headers = {};
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch(url, { headers });

            if (response.ok) {
                const data = await response.json();
                this.currentPosts = data.results || data;
                this.displayStudySessions(this.currentPosts);
            } else {
                throw new Error('Failed to load study sessions');
            }
        } catch (error) {
            console.error('Error loading study sessions:', error);
            this.showError('Unable to load study sessions. Please refresh the page.');
        } finally {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    // Display study sessions in the feed
    displayStudySessions(posts) {
        const sessionList = document.getElementById('sessionList');
        if (!sessionList) return;

        if (!posts || posts.length === 0) {
            sessionList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        sessionList.innerHTML = posts.map(post => this.createSessionCardHTML(post)).join('');
    }

    // Create HTML for a session card
    createSessionCardHTML(post) {
        const isLoggedIn = localStorage.getItem('access_token');
        const currentUserId = localStorage.getItem('user_data') ? 
            JSON.parse(localStorage.getItem('user_data')).id : null;
        const isOwnPost = currentUserId && post.user.id === currentUserId;
        
        const authorName = post.author_name || `${post.user.first_name} ${post.user.last_name}`.trim() || post.user.username;
        const authorInitials = this.getInitials(authorName);
        const authorAvatar = post.user.profile_picture || 
            `https://via.placeholder.com/50/3b82f6/ffffff?text=${encodeURIComponent(authorInitials)}`;
        
        const timeAgo = this.getTimeAgo(post.created_at);
        const postTypeLabel = this.getPostTypeLabel(post.post_type);
        const difficultyBadge = post.difficulty_level ? 
            `<span class="difficulty-badge ${post.difficulty_level}">${post.difficulty_level}</span>` : '';
        
        return `
            <div class="session-card" data-post-id="${post.id}">
                <div class="session-header">
                    <div class="user-avatar-large">
                        <img src="${authorAvatar}" alt="${authorName}" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="avatar-fallback" style="display: none;">${authorInitials}</span>
                    </div>
                    <div class="session-meta">
                        <h3 class="user-name">${authorName}</h3>
                        <div class="post-details">
                            <span class="post-type">${postTypeLabel}</span>
                            <span class="subject">${post.subject_area}</span>
                            ${difficultyBadge}
                            <span class="time-ago">${timeAgo}</span>
                        </div>
                    </div>
                    ${isOwnPost ? `
                        <div class="post-actions-dropdown">
                            <button class="post-menu-btn" onclick="studySessionsManager.togglePostMenu('${post.id}')">⋮</button>
                            <div class="post-menu" id="postMenu-${post.id}">
                                <a href="#" onclick="studySessionsManager.editPost('${post.id}')">Edit</a>
                                <a href="#" onclick="studySessionsManager.deletePost('${post.id}')">Delete</a>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="session-content">
                    <h4 class="session-title">${post.title}</h4>
                    <p class="session-description">${post.content}</p>
                    
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="tags">
                            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${post.expires_at ? `
                        <div class="expires-info">
                            <span class="expires-label">Expires:</span>
                            <span class="expires-time">${new Date(post.expires_at).toLocaleString()}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="session-stats">
                    <span class="stat">👁 ${post.view_count || 0} views</span>
                    <span class="stat">🙋 ${post.pending_requests || 0} requests</span>
                    <span class="stat">✅ ${post.accepted_requests || 0} joined</span>
                </div>
                
                ${isLoggedIn && !isOwnPost ? `
                    <div class="session-actions">
                        <button class="btn btn-primary" onclick="studySessionsManager.requestToJoin('${post.id}')">
                            Request to join
                        </button>
                        <button class="btn btn-secondary" onclick="studySessionsManager.sendMessage('${post.user.id}')">
                            Message
                        </button>
                    </div>
                ` : !isLoggedIn ? `
                    <div class="session-actions">
                        <p class="login-prompt">
                            <a href="user-selection.html">Log in</a> to join study sessions
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Get empty state HTML
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <h3>No study sessions yet</h3>
                <p>Be the first to create a study session!</p>
                <button class="btn btn-primary" onclick="openPostModal()">Create First Post</button>
            </div>
        `;
    }

    // Apply filters to current posts
    applyFilters() {
        const subjectFilter = document.getElementById('subject');
        const filters = {};
        
        if (subjectFilter && subjectFilter.value !== 'All') {
            filters.subject = subjectFilter.value;
        }

        this.loadStudySessions(filters);
    }

    // Search posts
    searchPosts(query) {
        const filters = { search: query };
        this.loadStudySessions(filters);
    }

    // Request to join a study session
    async requestToJoin(postId) {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            this.showNotification('Please log in to request to join.', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/study-sessions/join-requests/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    post: postId,
                    message: 'I would like to join this study session.'
                })
            });

            if (response.ok) {
                this.showNotification('Join request sent successfully!', 'success');
                // Update the button to show request sent
                this.updateJoinButton(postId, 'requested');
            } else {
                const errorData = await response.json();
                this.showNotification(errorData.detail || 'Failed to send join request', 'error');
            }
        } catch (error) {
            console.error('Error sending join request:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    // Update join button state
    updateJoinButton(postId, state) {
        const card = document.querySelector(`[data-post-id="${postId}"]`);
        if (!card) return;

        const joinBtn = card.querySelector('.btn-primary');
        if (!joinBtn) return;

        switch (state) {
            case 'requested':
                joinBtn.textContent = 'Request Sent';
                joinBtn.disabled = true;
                joinBtn.classList.add('btn-disabled');
                break;
            case 'accepted':
                joinBtn.textContent = 'Joined';
                joinBtn.disabled = true;
                joinBtn.classList.add('btn-success');
                break;
        }
    }

    // Send message (placeholder)
    sendMessage(userId) {
        this.showNotification('Messaging feature coming soon!', 'info');
    }

    // Toggle post menu
    togglePostMenu(postId) {
        const menu = document.getElementById(`postMenu-${postId}`);
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    // Edit post (placeholder)
    editPost(postId) {
        this.showNotification('Edit functionality coming soon!', 'info');
    }

    // Delete post (placeholder)
    deletePost(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            this.showNotification('Delete functionality coming soon!', 'info');
        }
    }

    // Show error message
    showError(message) {
        const sessionList = document.getElementById('sessionList');
        if (sessionList) {
            sessionList.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="studySessionsManager.loadStudySessions()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utility functions
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffMs = now - postDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    getPostTypeLabel(postType) {
        const labels = {
            'study_group': 'Study Group',
            'help_request': 'Help Request',
            'discussion': 'Discussion',
            'mentorship': 'Mentorship'
        };
        return labels[postType] || postType;
    }
}

// Initialize the manager when DOM is loaded
let studySessionsManager;
document.addEventListener('DOMContentLoaded', function() {
    studySessionsManager = new StudySessionsManager();
    studySessionsManager.init();
});
