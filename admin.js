// ══════════════════════════════════════════════
//  APK STORE — Admin Panel Logic
//  admin.js
// ══════════════════════════════════════════════

let currentEditId = null;
let uploadedApkData = null;
let uploadedApkName = '';
let uploadedApkSize = '';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  if (DB.isAdminLoggedIn()) {
    showAdminPanel();
  }
  setupDragDrop();
});

// ── Auth ──
function doLogin() {
  const pass = document.getElementById('admin-pass-input').value;
  const errEl = document.getElementById('login-error');
  if (!pass) { errEl.style.display = 'block'; errEl.textContent = '⚠️ Enter password'; return; }
  if (DB.verifyAdmin(pass)) {
    DB.loginAdmin();
    errEl.style.display = 'none';
    showAdminPanel();
  } else {
    errEl.style.display = 'block';
    errEl.textContent = '❌ Wrong password. Try again.';
    document.getElementById('admin-pass-input').value = '';
    document.getElementById('admin-pass-input').focus();
  }
}

function doLogout() {
  DB.logoutAdmin();
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-pass-input').value = '';
}

function showAdminPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
  renderDashboard();
  renderManageTable();
  populateCatFilter();
  showTab('dashboard');
}

// ── Tab Navigation ──
const TABS = ['dashboard', 'apps', 'upload', 'settings'];
const TITLES = {
  dashboard: ['Dashboard', 'Overview of your APK store'],
  apps: ['Manage Apps', 'Edit, delete or feature apps'],
  upload: ['Upload APK', 'Add a new app to the store'],
  settings: ['Settings', 'Password & data management'],
};

function showTab(tab) {
  TABS.forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`nav-${t}`).classList.toggle('active', t === tab);
  });
  document.getElementById('page-title').textContent = TITLES[tab][0];
  document.getElementById('page-subtitle').textContent = TITLES[tab][1];
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'apps') renderManageTable();
}

// ── Dashboard ──
function renderDashboard() {
  const stats = DB.getStats();
  const statsGrid = document.getElementById('stats-grid');
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon green">📱</div>
      <div><div class="stat-val">${stats.total}</div><div class="stat-label">Total Apps</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon purple">⬇</div>
      <div><div class="stat-val">${Utils.formatNum(stats.totalDownloads)}</div><div class="stat-label">Total Downloads</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon amber">📂</div>
      <div><div class="stat-val">${stats.categories}</div><div class="stat-label">Categories</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">🆕</div>
      <div><div class="stat-val">${stats.recent}</div><div class="stat-label">This Week</div></div>
    </div>
  `;

  // Recent apps table
  const apps = DB.getApps().slice(0, 10);
  const tbody = document.getElementById('recent-tbody');
  tbody.innerHTML = apps.map(app => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="app-row-icon">${app.icon ? `<img src="${app.icon}" alt="">` : app.iconEmoji || '📱'}</div>
          <div>
            <div style="font-weight:600">${app.name}</div>
            <div style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--text-dim)">${app.package}</div>
          </div>
        </div>
      </td>
      <td><span class="tag tag-cat">${app.category}</span></td>
      <td><span class="app-version">v${app.version}</span></td>
      <td style="font-family:'Space Mono',monospace;font-size:0.8rem">${app.size}</td>
      <td style="color:var(--accent);font-weight:600">${Utils.formatNum(app.downloads || 0)}</td>
      <td style="font-size:0.8rem;color:var(--text-dim)">${Utils.timeAgo(app.uploaded)}</td>
    </tr>
  `).join('');
}

// ── Manage Apps Table ──
function renderManageTable() {
  const query = (document.getElementById('admin-search') || {}).value || '';
  const cat = (document.getElementById('admin-cat-filter') || {}).value || 'All';
  const apps = DB.searchApps(query, cat);

  document.getElementById('manage-tbody').innerHTML = apps.map(app => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="app-row-icon">${app.icon ? `<img src="${app.icon}" alt="">` : app.iconEmoji || '📱'}</div>
          <div>
            <div style="font-weight:600">${app.name}</div>
            <div style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--text-dim)">${app.package}</div>
          </div>
        </div>
      </td>
      <td><span class="app-version">v${app.version}</span></td>
      <td style="font-family:'Space Mono',monospace;font-size:0.78rem">${app.size}</td>
      <td style="color:var(--accent);font-weight:600">${Utils.formatNum(app.downloads || 0)}</td>
      <td>
        <button class="toggle ${app.featured ? 'on' : ''}" onclick="toggleFeatured('${app.id}', this)"></button>
      </td>
      <td>
        ${app.apkData
          ? `<span style="color:var(--accent);font-size:0.78rem">✅ Attached</span>`
          : `<span style="color:var(--text-dim);font-size:0.78rem">⚠️ None</span>`
        }
      </td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="openEditModal('${app.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteApp('${app.id}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function populateCatFilter() {
  const sel = document.getElementById('admin-cat-filter');
  const cats = DB.getCategories();
  sel.innerHTML = cats.map(c => `<option>${c}</option>`).join('');
}

// ── Featured Toggle ──
function toggleFeatured(id, btn) {
  const app = DB.getApp(id);
  if (!app) return;
  const newVal = !app.featured;
  DB.updateApp(id, { featured: newVal });
  btn.classList.toggle('on', newVal);
  Utils.toast(`${app.name} ${newVal ? 'marked as featured' : 'removed from featured'}`, 'success');
}

// ── Delete App ──
function deleteApp(id) {
  const app = DB.getApp(id);
  if (!app) return;
  if (!confirm(`Delete "${app.name}"? This cannot be undone!`)) return;
  DB.deleteApp(id);
  renderManageTable();
  renderDashboard();
  Utils.toast(`"${app.name}" deleted`, 'error');
}

// ── Edit Modal ──
function openEditModal(id) {
  const app = DB.getApp(id);
  if (!app) return;
  currentEditId = id;
  document.getElementById('e-name').value = app.name;
  document.getElementById('e-package').value = app.package;
  document.getElementById('e-version').value = app.version;
  document.getElementById('e-category').value = app.category;
  document.getElementById('e-desc').value = app.description;
  document.getElementById('e-changelog').value = app.changelog || '';
  document.getElementById('e-featured').classList.toggle('on', !!app.featured);
  document.getElementById('edit-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
  document.body.style.overflow = '';
  currentEditId = null;
}

function saveEdit() {
  if (!currentEditId) return;
  const data = {
    name: document.getElementById('e-name').value.trim(),
    package: document.getElementById('e-package').value.trim(),
    version: document.getElementById('e-version').value.trim(),
    category: document.getElementById('e-category').value,
    description: document.getElementById('e-desc').value.trim(),
    changelog: document.getElementById('e-changelog').value.trim(),
    featured: document.getElementById('e-featured').classList.contains('on'),
  };
  if (!data.name || !data.package || !data.version) {
    Utils.toast('Fill in required fields', 'error');
    return;
  }
  DB.updateApp(currentEditId, data);
  closeEditModal();
  renderManageTable();
  renderDashboard();
  Utils.toast('App updated successfully', 'success');
}

// Click outside to close edit modal
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('edit-modal')) closeEditModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEditModal();
});

// ── APK File Upload ──
function setupDragDrop() {
  const zone = document.getElementById('apk-upload-zone');
  if (!zone) return;
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processApkFile(file);
  });
}

function handleApkFile(input) {
  const file = input.files[0];
  if (file) processApkFile(file);
}

function processApkFile(file) {
  if (!file.name.endsWith('.apk')) {
    Utils.toast('Please select a valid .apk file', 'error');
    return;
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    Utils.toast('APK file too large (max 100MB)', 'error');
    return;
  }

  uploadedApkName = file.name;
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
  uploadedApkSize = sizeInMB + ' MB';

  // Show progress
  const wrap = document.getElementById('upload-progress-wrap');
  wrap.classList.add('show');
  document.getElementById('apk-file-name').textContent = file.name;
  document.getElementById('apk-file-size').textContent = uploadedApkSize;

  // Auto-fill size field
  if (document.getElementById('f-name').value === '') {
    const guessedName = file.name.replace('.apk', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    document.getElementById('f-name').value = guessedName;
  }

  // Read as base64 with progress sim
  const fill = document.getElementById('progress-fill');
  fill.style.width = '0%';

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 90) { clearInterval(interval); }
    fill.style.width = Math.min(progress, 90) + '%';
  }, 80);

  const reader = new FileReader();
  reader.onload = (e) => {
    clearInterval(interval);
    fill.style.width = '100%';
    const base64 = e.target.result.split(',')[1];
    uploadedApkData = base64;
    Utils.toast(`APK loaded: ${uploadedApkSize}`, 'success');
  };
  reader.onerror = () => {
    Utils.toast('Failed to read APK file', 'error');
    clearInterval(interval);
  };
  reader.readAsDataURL(file);
}

function previewIcon() {
  const url = document.getElementById('f-icon-url').value;
  const preview = document.getElementById('icon-preview');
  if (url) {
    preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.innerHTML='❌'" />`;
  } else {
    preview.innerHTML = document.getElementById('f-icon-emoji').value || '📱';
  }
}

// ── Submit Upload ──
function submitUpload() {
  const name = document.getElementById('f-name').value.trim();
  const pkg = document.getElementById('f-package').value.trim();
  const version = document.getElementById('f-version').value.trim();
  const category = document.getElementById('f-category').value;
  const desc = document.getElementById('f-desc').value.trim();
  const errEl = document.getElementById('upload-error');

  errEl.style.display = 'none';

  if (!name || !pkg || !version || !category || !desc) {
    errEl.style.display = 'block';
    errEl.textContent = '⚠️ Fill in all required fields (Name, Package, Version, Category, Description)';
    return;
  }

  if (!pkg.includes('.')) {
    errEl.style.display = 'block';
    errEl.textContent = '⚠️ Package name should be like: com.example.app';
    return;
  }

  const iconUrl = document.getElementById('f-icon-url').value.trim();
  const iconEmoji = document.getElementById('f-icon-emoji').value.trim() || '📱';
  const featured = document.getElementById('f-featured-toggle').classList.contains('on');
  const versionCode = parseInt(document.getElementById('f-version-code').value) || 1;
  const changelog = document.getElementById('f-changelog').value.trim();

  const app = {
    name,
    package: pkg,
    version,
    versionCode,
    category,
    description: desc,
    changelog,
    icon: iconUrl,
    iconEmoji,
    featured,
    apkData: uploadedApkData,   // null if no file uploaded (metadata-only)
    apkName: uploadedApkName,
    size: uploadedApkSize || 'Unknown',
  };

  const newApp = DB.addApp(app);

  Utils.toast(`"${name}" uploaded successfully! ${uploadedApkData ? '✅ APK attached' : '⚠️ No APK file'}`, 'success');
  clearUploadForm();
  renderDashboard();
  renderManageTable();
  populateCatFilter();
  showTab('apps');
}

function clearUploadForm() {
  ['f-name','f-package','f-version','f-version-code','f-desc','f-changelog','f-icon-emoji','f-icon-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-category').value = '';
  document.getElementById('f-featured-toggle').classList.remove('on');
  document.getElementById('icon-preview').innerHTML = '📱';
  document.getElementById('upload-progress-wrap').classList.remove('show');
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('upload-error').style.display = 'none';
  document.getElementById('apk-file-input').value = '';
  uploadedApkData = null;
  uploadedApkName = '';
  uploadedApkSize = '';
}

// ── Change Password ──
function changePassword() {
  const current = document.getElementById('s-current-pass').value;
  const newPass = document.getElementById('s-new-pass').value;
  const confirm = document.getElementById('s-confirm-pass').value;

  if (!DB.verifyAdmin(current)) { Utils.toast('Current password is wrong', 'error'); return; }
  if (newPass.length < 6) { Utils.toast('New password must be at least 6 characters', 'error'); return; }
  if (newPass !== confirm) { Utils.toast('Passwords do not match', 'error'); return; }

  DB.changeAdminPassword(newPass);
  ['s-current-pass','s-new-pass','s-confirm-pass'].forEach(id => document.getElementById(id).value = '');
  Utils.toast('Password changed successfully!', 'success');
}

// ── Export / Import ──
function exportData() {
  const apps = DB.getApps();
  const json = JSON.stringify(apps, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `apkstore_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Utils.toast('Data exported successfully', 'success');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const apps = JSON.parse(e.target.result);
      if (!Array.isArray(apps)) throw new Error('Invalid format');
      if (!confirm(`Import ${apps.length} apps? This will REPLACE current data.`)) return;
      DB.saveApps(apps);
      renderDashboard();
      renderManageTable();
      populateCatFilter();
      Utils.toast(`Imported ${apps.length} apps`, 'success');
    } catch {
      Utils.toast('Invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}
