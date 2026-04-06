// API Base URL
const API_BASE_URL = window.location.origin + '/api';

// State management
let currentPage = 1;
let currentCategory = 'All';
let currentSearch = '';
let isLoading = false;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadApps();
    loadCategories();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentSearch = searchInput.value;
            currentPage = 1;
            loadApps();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentSearch = searchInput.value;
                currentPage = 1;
                loadApps();
            }
        });
    }
}

// Load categories
async function loadCategories() {
    try {
        const categories = ['All', 'Games', 'Productivity', 'Social', 'Entertainment', 'Education', 'Tools', 'Other'];
        const categoriesContainer = document.getElementById('categories');
        
        if (!categoriesContainer) return;
        
        categoriesContainer.innerHTML = categories.map(cat => `
            <button class="category-btn ${cat === currentCategory ? 'active' : ''}" 
                    onclick="filterByCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Filter by category
window.filterByCategory = function(category) {
    currentCategory = category;
    currentPage = 1;
    loadApps();
};

// Load apps
async function loadApps() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        let url = `${API_BASE_URL}/apps?page=${currentPage}&limit=12`;
        
        if (currentCategory !== 'All') {
            url += `&category=${currentCategory}`;
        }
        
        if (currentSearch) {
            url += `&search=${encodeURIComponent(currentSearch)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            displayApps(result.data);
            displayPagination(result.pagination);
        } else {
            showToast('Error loading apps: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading apps:', error);
        showToast('Failed to load apps', 'error');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// Display apps in grid
function displayApps(apps) {
    const appGrid = document.getElementById('appGrid');
    
    if (!appGrid) return;
    
    if (!apps || apps.length === 0) {
        appGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1;">No apps found</div>';
        return;
    }
    
    appGrid.innerHTML = apps.map(app => `
        <div class="app-card" onclick="viewApp('${app._id}')">
            <img src="${app.iconUrl}" alt="${app.name}" class="app-icon" 
                 onerror="this.src='/assets/images/default-icon.png'">
            <div class="app-info">
                <h3 class="app-name">${escapeHtml(app.name)}</h3>
                <div class="app-developer">${escapeHtml(app.developer)}</div>
                <div class="app-rating">
                    <div class="stars">${getStarRating(app.rating)}</div>
                    <span>(${app.totalRatings || 0})</span>
                </div>
                <div class="downloads">📥 ${formatNumber(app.downloads)} downloads</div>
                <button class="download-btn" onclick="event.stopPropagation(); downloadApp('${app._id}')">
                    Download
                </button>
            </div>
        </div>
    `).join('');
}

// Get star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    if (hasHalfStar) {
        stars += '½';
    }
    for (let i = stars.length; i < 5; i++) {
        stars += '☆';
    }
    
    return stars;
}

// Format number (e.g., 1000 -> 1K)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Display pagination
function displayPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer) return;
    
    if (pagination.pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let buttons = '';
    
    // Previous button
    if (pagination.page > 1) {
        buttons += `<button class="page-btn" onclick="goToPage(${pagination.page - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === pagination.page) {
            buttons += `<button class="page-btn active">${i}</button>`;
        } else if (Math.abs(i - pagination.page) <= 2) {
            buttons += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === 1 || i === pagination.pages) {
            buttons += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
        } else if (Math.abs(i - pagination.page) === 3) {
            buttons += `<span>...</span>`;
        }
    }
    
    // Next button
    if (pagination.page < pagination.pages) {
        buttons += `<button class="page-btn" onclick="goToPage(${pagination.page + 1})">Next</button>`;
    }
    
    paginationContainer.innerHTML = buttons;
}

// Go to page
window.goToPage = function(page) {
    currentPage = page;
    loadApps();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// View app details
window.viewApp = function(appId) {
    window.location.href = `/app/${appId}`;
};

// Download app
window.downloadApp = async function(appId) {
    try {
        showToast('Starting download...', 'success');
        window.location.href = `${API_BASE_URL}/apps/${appId}/download`;
    } catch (error) {
        console.error('Error downloading app:', error);
        showToast('Failed to start download', 'error');
    }
};

// Load app details for app page
async function loadAppDetails() {
    const appId = window.location.pathname.split('/').pop();
    
    if (!appId || appId === 'app.html') return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/apps/${appId}`);
        const result = await response.json();
        
        if (result.success) {
            displayAppDetails(result.data);
        } else {
            showToast('App not found', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading app details:', error);
        showToast('Failed to load app details', 'error');
    }
}

// Display app details
function displayAppDetails(app) {
    document.title = `${app.name} - APK Store`;
    
    const container = document.getElementById('appDetail');
    if (!container) return;
    
    container.innerHTML = `
        <div class="app-detail">
            <div class="app-header">
                <img src="${app.iconUrl}" alt="${app.name}" class="app-icon-large"
                     onerror="this.src='/assets/images/default-icon.png'">
                <div class="app-meta">
                    <h1>${escapeHtml(app.name)}</h1>
                    <p><strong>Developer:</strong> ${escapeHtml(app.developer)}</p>
                    <p><strong>Version:</strong> ${escapeHtml(app.version)}</p>
                    <p><strong>Category:</strong> ${app.category}</p>
                    <p><strong>Android:</strong> ${app.requiresAndroid}+</p>
                    <div class="app-rating">
                        <div class="stars">${getStarRating(app.rating)}</div>
                        <span>(${app.totalRatings || 0} ratings)</span>
                    </div>
                    <p><strong>Downloads:</strong> ${formatNumber(app.downloads)}</p>
                </div>
            </div>
            <div class="app-description">
                <h3>Description</h3>
                <p>${escapeHtml(app.description)}</p>
            </div>
            <div class="download-section">
                <button class="btn btn-primary" onclick="downloadApp('${app._id}')">
                    Download APK (${formatFileSize(app.fileSize)})
                </button>
            </div>
        </div>
    `;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show loading spinner
function showLoading() {
    const appGrid = document.getElementById('appGrid');
    if (appGrid && isLoading) {
        appGrid.innerHTML = '<div class="spinner"></div>';
    }
}

// Hide loading spinner
function hideLoading() {
    // Loading is handled by displayApps
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load featured apps for home page
async function loadFeaturedApps() {
    try {
        const response = await fetch(`${API_BASE_URL}/apps/featured`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const featuredSection = document.getElementById('featuredApps');
            if (featuredSection) {
                featuredSection.innerHTML = `
                    <h2>Featured Apps</h2>
                    <div class="app-grid">
                        ${result.data.slice(0, 6).map(app => `
                            <div class="app-card" onclick="viewApp('${app._id}')">
                                <img src="${app.iconUrl}" alt="${app.name}" class="app-icon"
                                     onerror="this.src='/assets/images/default-icon.png'">
                                <div class="app-info">
                                    <h3 class="app-name">${escapeHtml(app.name)}</h3>
                                    <div class="app-developer">${escapeHtml(app.developer)}</div>
                                    <div class="app-rating">
                                        <div class="stars">${getStarRating(app.rating)}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading featured apps:', error);
    }
}

// Initialize page based on current URL
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loadFeaturedApps();
} else if (window.location.pathname.includes('/app/')) {
    loadAppDetails();
}
