// Admin Dashboard JavaScript

// Global variables
let currentPage = 1;
let usersPerPage = 10;
let filteredUsers = [];
let allUsers = [];
let selectedUserId = null;

// Mock data for demonstration - in real app, this would come from API
const mockUsers = [
    {
        id: 1,
        name: "Ahmed Rahman",
        email: "ahmed.rahman@student.edu.bd",
        userType: "student",
        status: "active",
        isPremium: false,
        joinDate: "2024-01-15",
        lastActive: "2024-12-01",
        posts: 23,
        mentorshipRequests: 5
    },
    {
        id: 2,
        name: "Dr. Fatima Khan",
        email: "fatima.khan@mentor.com",
        userType: "mentor",
        status: "active",
        isPremium: true,
        joinDate: "2023-08-20",
        lastActive: "2024-12-01",
        posts: 156,
        mentorshipRequests: 0,
        mentoringSessions: 89
    },
    {
        id: 3,
        name: "Nasir Uddin",
        email: "nasir.uddin@gmail.com",
        userType: "student",
        status: "active",
        isPremium: true,
        joinDate: "2024-03-10",
        lastActive: "2024-11-30",
        posts: 45,
        mentorshipRequests: 12
    },
    {
        id: 4,
        name: "Rashida Begum",
        email: "rashida.begum@yahoo.com",
        userType: "student",
        status: "inactive",
        isPremium: false,
        joinDate: "2024-02-05",
        lastActive: "2024-11-15",
        posts: 8,
        mentorshipRequests: 2
    },
    {
        id: 5,
        name: "Prof. Mohammad Ali",
        email: "mohammad.ali@university.edu.bd",
        userType: "mentor",
        status: "active",
        isPremium: true,
        joinDate: "2023-06-12",
        lastActive: "2024-12-01",
        posts: 203,
        mentorshipRequests: 0,
        mentoringSessions: 156
    },
    {
        id: 6,
        name: "Salma Khatun",
        email: "salma.khatun@student.edu.bd",
        userType: "student",
        status: "active",
        isPremium: false,
        joinDate: "2024-04-18",
        lastActive: "2024-11-29",
        posts: 34,
        mentorshipRequests: 8
    },
    {
        id: 7,
        name: "Karim Hassan",
        email: "karim.hassan@outlook.com",
        userType: "student",
        status: "active",
        isPremium: true,
        joinDate: "2024-01-22",
        lastActive: "2024-12-01",
        posts: 67,
        mentorshipRequests: 15
    },
    {
        id: 8,
        name: "Dr. Ayesha Siddiqui",
        email: "ayesha.siddiqui@mentor.com",
        userType: "mentor",
        status: "active",
        isPremium: true,
        joinDate: "2023-09-08",
        lastActive: "2024-11-30",
        posts: 189,
        mentorshipRequests: 0,
        mentoringSessions: 112
    }
];

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin (in real app, verify with server)
    if (!isAdmin()) {
        window.location.href = 'index.html';
        return;
    }

    loadUsers();
    updateStatistics();
});

// Check if current user is admin
function isAdmin() {
    // In real application, this would check the user's role from authentication
    const userRole = localStorage.getItem('userRole');
    return userRole === 'admin';
}

// Load users from API (mock data for now)
async function loadUsers() {
    try {
        // In real app, replace with API call
        // const response = await fetch('/api/admin/users');
        // const users = await response.json();
        
        allUsers = mockUsers;
        filteredUsers = [...allUsers];
        renderUsers();
        updatePagination();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

// Update statistics cards
function updateStatistics() {
    const totalUsers = allUsers.length;
    const students = allUsers.filter(user => user.userType === 'student').length;
    const mentors = allUsers.filter(user => user.userType === 'mentor').length;
    const premiumUsers = allUsers.filter(user => user.isPremium).length;

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-students').textContent = students;
    document.getElementById('total-mentors').textContent = mentors;
    document.getElementById('premium-users').textContent = premiumUsers;
}

// Filter users based on search and type
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filterType = document.getElementById('user-filter').value;

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                            user.email.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterType === 'all' ||
                            (filterType === 'premium' && user.isPremium) ||
                            (filterType !== 'premium' && user.userType === filterType);

        return matchesSearch && matchesFilter;
    });

    currentPage = 1;
    renderUsers();
    updatePagination();
}

// Render users table
function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (currentUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #718096;">
                    No users found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }

    currentUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <span class="user-type-badge type-${user.userType}">
                    ${user.userType === 'student' ? 'Student' : 'Mentor'}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${user.status}
                </span>
                ${user.isPremium ? '<span class="status-badge status-premium">Premium</span>' : ''}
            </td>
            <td>${formatDate(user.joinDate)}</td>
            <td>${formatDate(user.lastActive)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewUser(${user.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="showDeleteModal(${user.id})" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startItem = (currentPage - 1) * usersPerPage + 1;
    const endItem = Math.min(currentPage * usersPerPage, filteredUsers.length);

    // Update info
    document.getElementById('pagination-info').textContent = 
        `Showing ${startItem}-${endItem} of ${filteredUsers.length} users`;

    // Update buttons
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages || totalPages === 0;

    // Update page numbers
    const pagesContainer = document.getElementById('pagination-pages');
    pagesContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => goToPage(i);
            pagesContainer.appendChild(pageBtn);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.5rem';
            pagesContainer.appendChild(ellipsis);
        }
    }
}

// Navigation functions
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderUsers();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderUsers();
        updatePagination();
    }
}

function goToPage(page) {
    currentPage = page;
    renderUsers();
    updatePagination();
}

// View user details
function viewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const detailsContent = document.getElementById('user-details-content');
    detailsContent.innerHTML = `
        <div style="text-align: left;">
            <h4 style="margin-bottom: 1rem; color: #2d3748;">User Information</h4>
            <div style="display: grid; gap: 0.75rem;">
                <div><strong>Name:</strong> ${user.name}</div>
                <div><strong>Email:</strong> ${user.email}</div>
                <div><strong>User Type:</strong> ${user.userType === 'student' ? 'Student' : 'Mentor'}</div>
                <div><strong>Status:</strong> ${user.status}</div>
                <div><strong>Premium:</strong> ${user.isPremium ? 'Yes' : 'No'}</div>
                <div><strong>Join Date:</strong> ${formatDate(user.joinDate)}</div>
                <div><strong>Last Active:</strong> ${formatDate(user.lastActive)}</div>
                <div><strong>Posts:</strong> ${user.posts}</div>
                ${user.userType === 'student' ? 
                    `<div><strong>Mentorship Requests:</strong> ${user.mentorshipRequests}</div>` :
                    `<div><strong>Mentoring Sessions:</strong> ${user.mentoringSessions}</div>`
                }
            </div>
        </div>
    `;

    document.getElementById('user-details-modal').style.display = 'block';
}

// Show delete confirmation modal
function showDeleteModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    selectedUserId = userId;
    
    document.getElementById('delete-user-details').innerHTML = `
        <div style="text-align: left;">
            <div><strong>Name:</strong> ${user.name}</div>
            <div><strong>Email:</strong> ${user.email}</div>
            <div><strong>Type:</strong> ${user.userType === 'student' ? 'Student' : 'Mentor'}</div>
            <div><strong>Posts:</strong> ${user.posts}</div>
        </div>
    `;

    document.getElementById('delete-modal').style.display = 'block';
}

// Confirm user deletion
async function confirmDeleteUser() {
    if (!selectedUserId) return;

    try {
        // Show loading state
        const deleteBtn = document.getElementById('confirm-delete-btn');
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        deleteBtn.disabled = true;

        // In real app, make API call to delete user
        // await fetch(`/api/admin/users/${selectedUserId}`, { method: 'DELETE' });

        // For demo, remove from mock data
        allUsers = allUsers.filter(user => user.id !== selectedUserId);
        filteredUsers = filteredUsers.filter(user => user.id !== selectedUserId);

        // Update UI
        renderUsers();
        updatePagination();
        updateStatistics();
        closeDeleteModal();
        showToast('User deleted successfully');

    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user', 'error');
    } finally {
        // Reset button state
        const deleteBtn = document.getElementById('confirm-delete-btn');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete User';
        deleteBtn.disabled = false;
    }
}

// Close modals
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    selectedUserId = null;
}

function closeUserDetailsModal() {
    document.getElementById('user-details-modal').style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const deleteModal = document.getElementById('delete-modal');
    const userDetailsModal = document.getElementById('user-details-modal');
    
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    if (event.target === userDetailsModal) {
        closeUserDetailsModal();
    }
}

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDeleteModal();
        closeUserDetailsModal();
    }
});
