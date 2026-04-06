// Admin panel JavaScript
let adminToken = localStorage.getItem('adminToken');
let currentPage = 1;
let editingAppId = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/admin.html')) {
        if (adminToken) {
            loadAdminPanel();
        } else {
            showLoginForm();
        }
    }
});

// Show login form
function showLoginForm() {
    const container = document.getElementById('adminContent');
    if (container) {
        container.innerHTML = `
            <div class="login-container">
                <h2>Admin Login</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="username" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
            </div>
        `;
        
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            adminToken = result.token;
            localStorage.setItem('adminToken', adminToken);
            showToast('Login successful!', 'success');
            loadAdminPanel();
        } else {
            showToast('Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed', 'error');
    }
}

// Load admin panel
async function loadAdminPanel() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="admin-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h1>Admin Dashboard</h1>
                <div>
                    <button class="btn btn-primary" onclick="showAddAppForm()">Add New App</button>
                    <button class="btn btn-warning" onclick="logout()">Logout</button>
                </div>
            </div>
            
            <div id="stats" class="stats-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="stat-card" style="padding: 1rem; background: var(--light-color); border-radius: 8px;">
                    <h3>Loading...</h3>
                </div>
            </div>
            
            <div class="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Name</th>
                            <th>Developer</th>
                            <th>Version</th>
                            <th>Downloads</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="appsTableBody">
                        <tr><td colspan="7">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <div id="pagination" class="pagination"></div>
        </div>
    `;
    
    await loadStats();
    await loadAppsAdmin();
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const statsContainer = document.getElementById('stats');
            statsContainer.innerHTML = `
                <div class="stat-card" style="padding: 1rem; background: var(--light-color); border-radius: 8px;">
                    <h3>Total Apps</h3>
                    <p style="font-size: 2rem; font-weight: bold;">${result.data.totalApps}</p>
                </div>
                <div class="stat-card" style="padding: 1rem; background: var(--light-color); border-radius: 8px;">
                    <h3>Total Downloads</h3>
                    <p style="font-size: 2rem; font-weight: bold;">${formatNumber(result.data.totalDownloads)}</p>
                </div>
                <div class="stat-card" style="padding: 1rem; background: var(--light-color); border-radius: 8px;">
                    <h3>Categories</h3>
                    <p style="font-size: 2rem; font-weight: bold;">${result.data.categories.length}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load apps for admin
async function loadAppsAdmin() {
    try {
        const response = await fetch(`/api/admin/apps?page=${currentPage}&limit=20`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayAppsTable(result.data);
            displayPaginationAdmin(result.pagination);
        } else {
            showToast('Error loading apps', 'error');
        }
    } catch (error) {
        console.error('Error loading apps:', error);
        showToast('Failed to load apps', 'error');
    }
}

// Display apps table
function displayAppsTable(apps) {
    const tbody = document.getElementById('appsTableBody');
    
    if (!apps || apps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No apps found</td></tr>';
        return;
    }
    
    tbody.innerHTML = apps.map(app => `
        <tr>
            <td><img src="${app.iconUrl}" alt="${app.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;"></td>
            <td>${escapeHtml(app.name)}</td>
            <td>${escapeHtml(app.developer)}</td>
            <td>${app.version}</td>
            <td>${formatNumber(app.downloads)}</td>
            <td>
                <span style="color: ${app.isActive ? 'green' : 'red'}">
                    ${app.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-primary" onclick="editApp('${app._id}')" style="margin-right: 0.5rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteApp('${app._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Display pagination for admin
function displayPaginationAdmin(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer) return;
    
    if (pagination.pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let buttons = '';
    
    if (pagination.page > 1) {
        buttons += `<button class="page-btn" onclick="goToPageAdmin(${pagination.page - 1})">Previous</button>`;
    }
    
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === pagination.page) {
            buttons += `<button class="page-btn active">${i}</button>`;
        } else if (Math.abs(i - pagination.page) <= 2) {
            buttons += `<button class="page-btn" onclick="goToPageAdmin(${i})">${i}</button>`;
        }
    }
    
    if (pagination.page < pagination.pages) {
        buttons += `<button class="page-btn" onclick="goToPageAdmin(${pagination.page + 1})">Next</button>`;
    }
    
    paginationContainer.innerHTML = buttons;
}

// Go to page admin
window.goToPageAdmin = function(page) {
    currentPage = page;
    loadAppsAdmin();
};

// Show add/edit app form
window.showAddAppForm = function() {
    editingAppId = null;
    const formHtml = `
        <div id="appFormModal" class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90%; overflow-y: auto;">
                <h2>${editingAppId ? 'Edit App' : 'Add New App'}</h2>
                <form id="appForm">
                    <div class="form-group">
                        <label>App Name *</label>
                        <input type="text" id="appName" required>
                    </div>
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea id="appDescription" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Version *</label>
                        <input type="text" id="appVersion" placeholder="1.0.0" required>
                    </div>
                    <div class="form-group">
                        <label>Developer *</label>
                        <input type="text" id="appDeveloper" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="appCategory" required>
                            <option value="Games">Games</option>
                            <option value="Productivity">Productivity</option>
                            <option value="Social">Social</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Education">Education</option>
                            <option value="Tools">Tools</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Android Version Required</label>
                        <input type="text" id="appAndroid" value="4.4+">
                    </div>
                    <div class="form-group">
                        <label>Icon URL</label>
                        <input type="url" id="appIcon" placeholder="https://...">
                    </div>
                    ${!editingAppId ? `
                        <div class="form-group">
                            <label>APK File *</label>
                            <input type="file" id="apkFile" accept=".apk" required>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label>Status</label>
                        <select id="appStatus">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary">${editingAppId ? 'Update' : 'Create'}</button>
                        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById('appForm').addEventListener('submit', handleAppFormSubmit);
    
    if (editingAppId) {
        loadAppForEdit(editingAppId);
    }
};

// Load app for editing
async function loadAppForEdit(appId) {
    try {
        const response = await fetch(`/api/apps/${appId}`);
        const result = await response.json();
        
        if (result.success) {
            const app = result.data;
            document.getElementById('appName').value = app.name;
            document.getElementById('appDescription').value = app.description;
            document.getElementById('appVersion').value = app.version;
            document.getElementById('appDeveloper').value = app.developer;
            document.getElementById('appCategory').value = app.category;
            document.getElementById('appAndroid').value = app.requiresAndroid;
            document.getElementById('appIcon').value = app.iconUrl;
            document.getElementById('appStatus').value = app.isActive.toString();
        }
    } catch (error) {
        console.error('Error loading app:', error);
        showToast('Failed to load app data', 'error');
    }
}

// Handle form submission
async function handleAppFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('appName').value);
    formData.append('description', document.getElementById('appDescription').value);
    formData.append('version', document.getElementById('appVersion').value);
    formData.append('developer', document.getElementById('appDeveloper').value);
    formData.append('category', document.getElementById('appCategory').value);
    formData.append('requiresAndroid', document.getElementById('appAndroid').value);
    formData.append('iconUrl', document.getElementById('appIcon').value);
    formData.append('isActive', document.getElementById('appStatus').value);
    
    if (!editingAppId) {
        const apkFile = document.getElementById('apkFile').files[0];
        if (!apkFile) {
            showToast('Please select an APK file', 'error');
            return;
        }
        formData.append('apkFile', apkFile);
    }
    
    try {
        const url = editingAppId ? `/api/admin/apps/${editingAppId}` : '/api/admin/apps';
        const method = editingAppId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(editingAppId ? 'App updated successfully' : 'App created successfully', 'success');
            closeModal();
            loadAppsAdmin();
            loadStats();
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving app:', error);
        showToast('Failed to save app', 'error');
    }
}

// Edit app
window.editApp = function(appId) {
    editingAppId = appId;
    showAddAppForm();
};

// Delete app
window.deleteApp = async function(appId) {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/apps/${appId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('App deleted successfully', 'success');
            loadAppsAdmin();
            loadStats();
        } else {
            showToast('Error deleting app', 'error');
        }
    } catch (error) {
        console.error('Error deleting app:', error);
        showToast('Failed to delete app', 'error');
    }
};

// Close modal
window.closeModal = function() {
    const modal = document.getElementById('appFormModal');
    if (modal) {
        modal.remove();
    }
    editingAppId = null;
};

// Logout
window.logout = function() {
    localStorage.removeItem('adminToken');
    adminToken = null;
    showLoginForm();
    showToast('Logged out successfully', 'success');
};

// Helper functions
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
