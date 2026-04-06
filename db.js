// ══════════════════════════════════════════════
//  APK STORE — Database Layer (localStorage)
//  db.js — No backend needed, Git-friendly
// ══════════════════════════════════════════════

const DB = {
  KEYS: {
    APPS: 'apkstore_apps',
    ADMIN_PASS: 'apkstore_admin_pass',
    DOWNLOADS: 'apkstore_downloads',
  },

  // ── Init seed data ──
  init() {
    if (!localStorage.getItem(this.KEYS.ADMIN_PASS)) {
      // Default admin password (change in admin panel)
      localStorage.setItem(this.KEYS.ADMIN_PASS, btoa('admin@123'));
    }
    if (!localStorage.getItem(this.KEYS.APPS)) {
      // Sample apps for demo
      const sample = [
        {
          id: this._id(),
          name: 'PhotoFX Pro',
          package: 'com.photofx.pro',
          version: '2.1.0',
          versionCode: 21,
          category: 'Photography',
          size: '18.4 MB',
          sizeBytes: 19292160,
          description: 'Professional photo editor with 100+ filters, curves, healing brush and RAW support. Edit like a pro right on your phone.',
          icon: '',
          iconEmoji: '📷',
          apkData: null,
          apkName: '',
          downloads: 1247,
          uploaded: Date.now() - 86400000 * 5,
          featured: true,
          changelog: 'Added RAW support, fixed crash on Android 14',
        },
        {
          id: this._id(),
          name: 'TaskFlow',
          package: 'com.taskflow.app',
          version: '1.5.2',
          versionCode: 15,
          category: 'Productivity',
          size: '8.2 MB',
          sizeBytes: 8601600,
          description: 'Smart task manager with Kanban boards, reminders, tags and team collaboration features built-in.',
          icon: '',
          iconEmoji: '✅',
          apkData: null,
          apkName: '',
          downloads: 892,
          uploaded: Date.now() - 86400000 * 2,
          featured: true,
          changelog: 'Improved sync, dark mode polish',
        },
        {
          id: this._id(),
          name: 'SpeedNet',
          package: 'com.speednet.test',
          version: '3.0.1',
          versionCode: 30,
          category: 'Tools',
          size: '5.6 MB',
          sizeBytes: 5872025,
          description: 'Ultra-fast internet speed tester. Test download, upload and ping with detailed history graphs.',
          icon: '',
          iconEmoji: '⚡',
          apkData: null,
          apkName: '',
          downloads: 3421,
          uploaded: Date.now() - 86400000 * 10,
          featured: false,
          changelog: 'Added IPv6 support',
        },
        {
          id: this._id(),
          name: 'BeatBox DJ',
          package: 'com.beatbox.dj',
          version: '1.0.0',
          versionCode: 10,
          category: 'Music',
          size: '22.1 MB',
          sizeBytes: 23183360,
          description: 'Create beats, mix tracks and perform live sets. 500+ samples, 8-track mixer and built-in effects.',
          icon: '',
          iconEmoji: '🎵',
          apkData: null,
          apkName: '',
          downloads: 567,
          uploaded: Date.now() - 86400000 * 1,
          featured: false,
          changelog: 'Initial release',
        },
        {
          id: this._id(),
          name: 'WalletGuard',
          package: 'com.walletguard.finance',
          version: '2.4.0',
          versionCode: 24,
          category: 'Finance',
          size: '11.3 MB',
          sizeBytes: 11847680,
          description: 'Track expenses, set budgets and get insights into your spending habits. Supports UPI, bank sync and reports.',
          icon: '',
          iconEmoji: '💳',
          apkData: null,
          apkName: '',
          downloads: 2108,
          uploaded: Date.now() - 86400000 * 7,
          featured: true,
          changelog: 'UPI integration, CSV export',
        },
        {
          id: this._id(),
          name: 'QuizMaster',
          package: 'com.quizmaster.learn',
          version: '1.2.1',
          versionCode: 12,
          category: 'Education',
          size: '14.7 MB',
          sizeBytes: 15413248,
          description: 'Learn anything through spaced repetition quizzes. 50+ topics, offline mode, and performance analytics.',
          icon: '',
          iconEmoji: '🎓',
          apkData: null,
          apkName: '',
          downloads: 1890,
          uploaded: Date.now() - 86400000 * 3,
          featured: false,
          changelog: 'Added Hindi language pack',
        },
      ];
      localStorage.setItem(this.KEYS.APPS, JSON.stringify(sample));
    }
  },

  _id() {
    return 'app_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  },

  // ── Apps CRUD ──
  getApps() {
    return JSON.parse(localStorage.getItem(this.KEYS.APPS) || '[]');
  },

  saveApps(apps) {
    localStorage.setItem(this.KEYS.APPS, JSON.stringify(apps));
  },

  getApp(id) {
    return this.getApps().find(a => a.id === id) || null;
  },

  addApp(app) {
    const apps = this.getApps();
    const newApp = { ...app, id: this._id(), downloads: 0, uploaded: Date.now() };
    apps.unshift(newApp);
    this.saveApps(apps);
    return newApp;
  },

  updateApp(id, data) {
    const apps = this.getApps();
    const i = apps.findIndex(a => a.id === id);
    if (i === -1) return false;
    apps[i] = { ...apps[i], ...data };
    this.saveApps(apps);
    return true;
  },

  deleteApp(id) {
    const apps = this.getApps().filter(a => a.id !== id);
    this.saveApps(apps);
  },

  incrementDownload(id) {
    const apps = this.getApps();
    const i = apps.findIndex(a => a.id === id);
    if (i !== -1) {
      apps[i].downloads = (apps[i].downloads || 0) + 1;
      this.saveApps(apps);
      return apps[i].downloads;
    }
  },

  // ── Search & Filter ──
  searchApps(query, category = 'All') {
    let apps = this.getApps();
    if (category !== 'All') {
      apps = apps.filter(a => a.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      apps = apps.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.package.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return apps;
  },

  getFeatured() {
    return this.getApps().filter(a => a.featured).slice(0, 6);
  },

  getCategories() {
    const cats = [...new Set(this.getApps().map(a => a.category))];
    return ['All', ...cats.sort()];
  },

  getStats() {
    const apps = this.getApps();
    return {
      total: apps.length,
      totalDownloads: apps.reduce((s, a) => s + (a.downloads || 0), 0),
      categories: [...new Set(apps.map(a => a.category))].length,
      recent: apps.filter(a => Date.now() - a.uploaded < 86400000 * 7).length,
    };
  },

  // ── Admin Auth ──
  verifyAdmin(password) {
    const stored = localStorage.getItem(this.KEYS.ADMIN_PASS);
    return stored === btoa(password);
  },

  changeAdminPassword(newPass) {
    localStorage.setItem(this.KEYS.ADMIN_PASS, btoa(newPass));
  },

  isAdminLoggedIn() {
    return sessionStorage.getItem('apkstore_admin') === 'true';
  },

  loginAdmin() {
    sessionStorage.setItem('apkstore_admin', 'true');
  },

  logoutAdmin() {
    sessionStorage.removeItem('apkstore_admin');
  },
};

// ── Helper Utilities ──
const Utils = {
  timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  },

  formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => el.style.opacity = '0', 2800);
    setTimeout(() => el.remove(), 3200);
  },

  debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },

  CATEGORIES: ['All', 'Tools', 'Productivity', 'Photography', 'Music', 'Finance', 'Education', 'Entertainment', 'Social', 'Games', 'Health', 'Other'],
};

// Auto-init
DB.init();
