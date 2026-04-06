// ══════════════════════════════════════════════
//  APK STORE — User Interface Logic
//  user.js
// ══════════════════════════════════════════════

let currentView = 'grid';     // 'grid' | 'list'
let currentCategory = 'All';
let currentQuery = '';
let currentApp = null;

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  renderFeatured();
  renderApps();
  updateBadge();
  bindEvents();
});

function bindEvents() {
  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', Utils.debounce(() => {
    currentQuery = searchInput.value;
    renderApps();
  }, 280));

  // View toggle
  document.getElementById('grid-btn').addEventListener('click', () => setView('grid'));
  document.getElementById('list-btn').addEventListener('click', () => setView('list'));

  // Close modal on backdrop click
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detail-modal')) closeModal();
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ── View Toggle ──
function setView(v) {
  currentView = v;
  document.getElementById('grid-btn').classList.toggle('active', v === 'grid');
  document.getElementById('list-btn').classList.toggle('active', v === 'list');
  renderApps();
}

// ── Category Chips ──
function renderCategories() {
  const cats = DB.getCategories();
  const container = document.getElementById('filter-chips');
  container.innerHTML = cats.map(cat => `
    <button class="chip ${cat === currentCategory ? 'active' : ''}" onclick="filterByCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function filterByCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderApps();
  // Hide featured when filtering
  const featuredSection = document.getElementById('featured-section');
  if (featuredSection) {
    featuredSection.style.display = (cat === 'All' && !currentQuery) ? '' : 'none';
  }
}

// ── Featured ──
function renderFeatured() {
  const apps = DB.getFeatured();
  const grid = document.getElementById('featured-grid');
  if (!apps.length) {
    document.getElementById('featured-section').style.display = 'none';
    return;
  }
  grid.innerHTML = apps.map(app => appCardHTML(app)).join('');
}

// ── Apps List ──
function renderApps() {
  const apps = DB.searchApps(currentQuery, currentCategory);
  const container = document.getElementById('apps-container');
  const countEl = document.getElementById('results-count');
  const labelEl = document.getElementById('section-label');

  countEl.textContent = `${apps.length} app${apps.length !== 1 ? 's' : ''}`;

  if (currentQuery) {
    labelEl.textContent = `Results for "${currentQuery}"`;
  } else if (currentCategory !== 'All') {
    labelEl.textContent = currentCategory;
  } else {
    labelEl.textContent = 'All Apps';
  }

  if (!apps.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>No apps found</h3>
        <p>Try a different search term or category</p>
      </div>`;
    return;
  }

  if (currentView === 'grid') {
    container.innerHTML = `<div class="apps-grid">${apps.map(app => appCardHTML(app)).join('')}</div>`;
  } else {
    container.innerHTML = `<div class="app-card-list">${apps.map(app => appRowHTML(app)).join('')}</div>`;
  }
}

// ── Card Templates ──
function appCardHTML(app) {
  const isNew = Date.now() - app.uploaded < 86400000 * 7;
  return `
    <div class="app-card" onclick="openDetail('${app.id}')">
      <div style="display:flex;gap:14px;align-items:flex-start">
        <div class="app-icon">${app.icon ? `<img src="${app.icon}" alt="">` : app.iconEmoji || '📱'}</div>
        <div class="app-meta">
          <div class="app-name">${app.name}</div>
          <div class="app-package">${app.package}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            <span class="tag tag-cat">${app.category}</span>
            ${isNew ? `<span class="tag tag-new">NEW</span>` : ''}
          </div>
        </div>
      </div>
      <div class="app-desc">${app.description}</div>
      <div class="app-footer">
        <span class="app-version">v${app.version}</span>
        <span class="app-size">${app.size}</span>
        <span class="app-downloads">⬇ ${Utils.formatNum(app.downloads || 0)}</span>
      </div>
    </div>`;
}

function appRowHTML(app) {
  const isNew = Date.now() - app.uploaded < 86400000 * 7;
  return `
    <div class="app-card-row" onclick="openDetail('${app.id}')">
      <div class="app-icon">${app.icon ? `<img src="${app.icon}" alt="">` : app.iconEmoji || '📱'}</div>
      <div class="app-meta">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <span class="app-name">${app.name}</span>
          ${isNew ? `<span class="tag tag-new">NEW</span>` : ''}
        </div>
        <div class="app-package">${app.package}</div>
        <div class="app-desc" style="-webkit-line-clamp:1">${app.description}</div>
      </div>
      <div class="app-actions">
        <span class="tag tag-cat" style="white-space:nowrap">${app.category}</span>
        <span class="app-version">v${app.version}</span>
        <span class="app-size" style="font-size:0.72rem;color:var(--text-dim)">${app.size}</span>
        <span class="app-downloads">⬇ ${Utils.formatNum(app.downloads || 0)}</span>
      </div>
    </div>`;
}

// ── App Detail Modal ──
function openDetail(id) {
  const app = DB.getApp(id);
  if (!app) return;
  currentApp = app;

  const content = document.getElementById('modal-content');
  const downloadBtn = document.getElementById('modal-download-btn');
  const isNew = Date.now() - app.uploaded < 86400000 * 7;
  const hasApk = !!app.apkData;

  content.innerHTML = `
    <div class="detail-hero">
      <div class="app-icon detail-icon" style="width:80px;height:80px;font-size:40px">
        ${app.icon ? `<img src="${app.icon}" alt="">` : app.iconEmoji || '📱'}
      </div>
      <div>
        <div class="detail-name">${app.name}</div>
        <div class="app-package" style="margin-bottom:8px">${app.package}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="tag tag-cat">${app.category}</span>
          ${isNew ? `<span class="tag tag-new">NEW</span>` : ''}
          <span class="app-downloads">⬇ ${Utils.formatNum(app.downloads || 0)} downloads</span>
        </div>
      </div>
    </div>

    <div class="detail-meta">
      <div class="detail-field">
        <label>Version</label>
        <p>${app.version} (${app.versionCode || 1})</p>
      </div>
      <div class="detail-field">
        <label>Size</label>
        <p>${app.size}</p>
      </div>
      <div class="detail-field">
        <label>Category</label>
        <p>${app.category}</p>
      </div>
      <div class="detail-field">
        <label>Uploaded</label>
        <p>${Utils.formatDate(app.uploaded)}</p>
      </div>
    </div>

    <p class="detail-desc">${app.description}</p>

    ${app.changelog ? `
    <div class="detail-changelog">
      <h4>📋 What's New in v${app.version}</h4>
      <p>${app.changelog}</p>
    </div>` : ''}

    ${!hasApk ? `
    <div class="no-apk-hint">
      ⚠️ APK file not attached — Admin ne sirf metadata upload kiya hai. Download disabled.
    </div>` : ''}
  `;

  downloadBtn.disabled = !hasApk;
  downloadBtn.style.opacity = hasApk ? '1' : '0.4';
  downloadBtn.onclick = hasApk ? () => downloadApp(app.id) : null;

  document.getElementById('detail-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('open');
  document.body.style.overflow = '';
  currentApp = null;
}

// ── Download APK ──
function downloadApp(id) {
  const app = DB.getApp(id);
  if (!app || !app.apkData) {
    Utils.toast('APK file not available', 'error');
    return;
  }

  try {
    // Convert base64 back to blob and trigger download
    const byteChars = atob(app.apkData);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: 'application/vnd.android.package-archive' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = app.apkName || `${app.name.replace(/\s+/g, '_')}_v${app.version}.apk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Increment download counter
    const newCount = DB.incrementDownload(id);
    Utils.toast(`Downloading ${app.name}...`, 'success');

    // Update modal counter live
    const dlEl = document.querySelector('.app-downloads');
    if (dlEl) dlEl.textContent = `⬇ ${Utils.formatNum(newCount)} downloads`;

    updateBadge();
  } catch (err) {
    Utils.toast('Download failed: ' + err.message, 'error');
  }
}

// ── Badge ──
function updateBadge() {
  const stats = DB.getStats();
  const el = document.getElementById('app-count-badge');
  if (el) el.textContent = `${stats.total} apps • ${Utils.formatNum(stats.totalDownloads)} downloads`;
}
