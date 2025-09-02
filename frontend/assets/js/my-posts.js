// API Configuration - Use dynamic URL like other pages
const StudySyncConfig = window.StudySyncConfig || {
    API_BASE_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
        return 'https://study-sync-teal.vercel.app';
    })()
};

const API_BASE_URL = StudySyncConfig.API_BASE_URL + '/api';
const ENDPOINTS = {
    MY_POSTS: '/study-sessions/my-posts/',
    POSTS: '/study-sessions/posts/',
    JOIN_REQUESTS: '/study-sessions/join-requests/',
    RESPOND_TO_REQUEST: (requestId) => `/study-sessions/join-requests/${requestId}/respond/`,
};

// Get CSRF token from Django
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

// Get auth token from localStorage (using correct key)
function getAuthToken() {
    return localStorage.getItem('access_token') || '';
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
    };
    
    const authToken = getAuthToken();
    if (authToken) {
        defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
        headers: defaultHeaders,
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Fetch user's posts
async function fetchMyPosts() {
    try {
        const posts = await apiRequest(ENDPOINTS.MY_POSTS);
        renderPosts(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        showErrorMessage('Failed to load your posts. Please try again.');
    }
}

// Create a new post
async function createPost(postData) {
    try {
        const newPost = await apiRequest(ENDPOINTS.POSTS, {
            method: 'POST',
            body: JSON.stringify(postData),
        });
        
        // Refresh the posts list
        await fetchMyPosts();
        showSuccessMessage('Post created successfully!');
        return newPost;
    } catch (error) {
        console.error('Error creating post:', error);
        showErrorMessage('Failed to create post. Please try again.');
        throw error;
    }
}

// Delete a post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        await apiRequest(`${ENDPOINTS.POSTS}${postId}/`, {
            method: 'DELETE',
        });
        
        // Refresh the posts list
        await fetchMyPosts();
        showSuccessMessage('Post deleted successfully!');
    } catch (error) {
        console.error('Error deleting post:', error);
        showErrorMessage('Failed to delete post. Please try again.');
    }
}

// Update a post
async function updatePost(postId, postData) {
    try {
        const updatedPost = await apiRequest(`${ENDPOINTS.POSTS}${postId}/`, {
            method: 'PATCH',
            body: JSON.stringify(postData),
        });
        
        // Refresh the posts list
        await fetchMyPosts();
        showSuccessMessage('Post updated successfully!');
        return updatedPost;
    } catch (error) {
        console.error('Error updating post:', error);
        showErrorMessage('Failed to update post. Please try again.');
        throw error;
    }
}

// Respond to a join request
async function respondToJoinRequest(requestId, status, responseMessage = '') {
    try {
        const response = await apiRequest(ENDPOINTS.RESPOND_TO_REQUEST(requestId), {
            method: 'PATCH',
            body: JSON.stringify({
                status: status,
                response_message: responseMessage,
            }),
        });
        
        showSuccessMessage(`Request ${status} successfully!`);
        return response;
    } catch (error) {
        console.error('Error responding to join request:', error);
        showErrorMessage('Failed to respond to request. Please try again.');
        throw error;
    }
}

// Render posts in the UI
function renderPosts(posts) {
    const sessionList = document.querySelector('.session-list');
    if (!sessionList) return;
    
    sessionList.innerHTML = '';
    
    if (posts.length === 0) {
        sessionList.innerHTML = `
            <div class="no-posts-message">
                <h3>No posts found</h3>
                <p>You haven't created any study sessions yet. Click "Post a New Session" to get started!</p>
            </div>
        `;
        return;
    }
    
    posts.forEach(post => {
        const postElement = createPostElement(post);
        sessionList.appendChild(postElement);
    });
}

// Create HTML element for a single post
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'session-card';
    postDiv.setAttribute('data-post-id', post.id);
    
    const statusClass = getStatusClass(post);
    const statusText = getStatusText(post);
    
    postDiv.innerHTML = `
        <div class="user-avatar blue-avatar">
            <span>Me</span>
        </div>
        <div class="session-info">
            <h3 class="user-name">Your Session</h3>
            <p class="subject">${escapeHtml(post.title)}</p>
            <p class="subject-area">${escapeHtml(post.subject_area)}</p>
            <p class="time-slot">Posted ${formatDate(post.created_at)}</p>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="session-actions">
            ${createActionButtons(post)}
        </div>
    `;
    
    return postDiv;
}

// Get status class based on post data
function getStatusClass(post) {
    if (post.expires_at && new Date(post.expires_at) < new Date()) {
        return 'completed';
    }
    return post.pending_requests > 0 ? 'active' : 'active';
}

// Get status text based on post data
function getStatusText(post) {
    if (post.expires_at && new Date(post.expires_at) < new Date()) {
        return `Completed - ${post.accepted_requests} participants`;
    }
    
    if (post.pending_requests > 0) {
        return `Active - ${post.pending_requests} pending, ${post.accepted_requests} participants`;
    }
    
    return `Active - ${post.accepted_requests} participants`;
}

// Create action buttons based on post status
function createActionButtons(post) {
    const isExpired = post.expires_at && new Date(post.expires_at) < new Date();
    
    if (isExpired) {
        return `
            <button class="btn btn-secondary btn-icon btn-details" onclick="viewPostDetails('${post.id}')">View Details</button>
            <button class="btn btn-success btn-icon btn-rate" onclick="viewParticipants('${post.id}')">Rate Participants</button>
        `;
    }
    
    return `
        <button class="btn btn-secondary btn-icon btn-edit" onclick="editPost('${post.id}')">Edit</button>
        <button class="btn btn-success btn-icon btn-participants" onclick="viewParticipants('${post.id}')">View Participants</button>
        <button class="btn btn-danger btn-icon btn-delete" onclick="deletePost('${post.id}')">Delete</button>
    `;
}

// Event handlers for buttons
function editPost(postId) {
    // Implementation for editing post
    console.log('Edit post:', postId);
    // You can implement a modal or redirect to edit page
}

function viewParticipants(postId) {
    // Implementation for viewing participants
    console.log('View participants for post:', postId);
    // You can implement a modal or redirect to participants page
}

function viewPostDetails(postId) {
    // Implementation for viewing post details
    console.log('View details for post:', postId);
    // You can implement a modal or redirect to details page
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function showSuccessMessage(message) {
    // Implementation for showing success message
    console.log('Success:', message);
    // You can implement a toast notification or alert
}

function showErrorMessage(message) {
    // Implementation for showing error message
    console.error('Error:', message);
    // You can implement a toast notification or alert
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Fetch posts when page loads
    fetchMyPosts();
    
    // Handle "Post a New Session" button
    const postNewSessionBtn = document.querySelector('.btn-primary.btn-full');
    if (postNewSessionBtn) {
        postNewSessionBtn.addEventListener('click', function() {
            // Implementation for creating new post
            console.log('Post new session clicked');
            // You can implement a modal or redirect to create page
        });
    }
    
    // Handle filter changes
    const statusFilter = document.getElementById('status');
    const subjectFilter = document.getElementById('subject');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            // Implementation for filtering by status
            filterPosts();
        });
    }
    
    if (subjectFilter) {
        subjectFilter.addEventListener('change', function() {
            // Implementation for filtering by subject
            filterPosts();
        });
    }
});

// Filter posts based on selected filters
function filterPosts() {
    const statusFilter = document.getElementById('status')?.value;
    const subjectFilter = document.getElementById('subject')?.value;
    
    // Apply filters to the displayed posts
    const sessionCards = document.querySelectorAll('.session-card');
    
    sessionCards.forEach(card => {
        let shouldShow = true;
        
        // Apply status filter
        if (statusFilter && statusFilter !== 'All') {
            const statusBadge = card.querySelector('.status-badge');
            const statusText = statusBadge?.textContent || '';
            
            if (statusFilter === 'Active' && !statusText.includes('Active')) {
                shouldShow = false;
            } else if (statusFilter === 'Completed' && !statusText.includes('Completed')) {
                shouldShow = false;
            }
        }
        
        // Apply subject filter
        if (subjectFilter && subjectFilter !== 'All') {
            const subjectElement = card.querySelector('.subject-area');
            const subjectText = subjectElement?.textContent || '';
            
            if (!subjectText.includes(subjectFilter)) {
                shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'flex' : 'none';
    });
}

// Export functions for global access
window.MyPostsAPI = {
    fetchMyPosts,
    createPost,
    deletePost,
    updatePost,
    respondToJoinRequest,
};
