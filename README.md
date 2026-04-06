# 📦 APK Store — Self-Hosted Android App Distribution

A complete, **no-backend** APK distribution website. All data stored in browser localStorage. Ready to push to GitHub Pages or any static host.

---

## 📁 File Structure

```
apk-store/
├── index.html      ← User-facing store (browse, search, download)
├── admin.html      ← Admin panel (upload, manage apps)
├── style.css       ← All styles (shared)
├── db.js           ← Data layer (localStorage CRUD)
├── user.js         ← User UI logic
├── admin.js        ← Admin UI logic
└── README.md
```

---

## 🚀 Features

### 👤 User Side (`index.html`)
- Browse all apps in **grid or list view**
- **Search** by name, package, description, category
- **Filter by category** (chips)
- **Featured apps** section
- App detail modal with full info (version, size, category, changelog)
- **Direct APK download** (if admin uploaded the file)
- Download counter (live update)

### 🔐 Admin Side (`admin.html`)
- Separate admin login (default password: `admin@123`)
- **Dashboard** with stats (total apps, downloads, categories, recent)
- **Upload APK** with full metadata form:
  - APK file (drag & drop or click)
  - Name, package name, version, version code
  - Category, description, changelog
  - Icon (emoji or URL)
  - Featured toggle
- **Manage Apps** table with:
  - Edit app info
  - Delete app
  - Toggle featured
  - APK attachment status
- **Settings**: Change password, Export/Import JSON backup

---

## ⚙️ Setup

### Option 1: Local
Just open `index.html` in your browser. No server needed!

### Option 2: GitHub Pages
1. Push all files to a GitHub repo
2. Go to Settings → Pages → Deploy from branch `main`
3. Your store is live at `https://yourusername.github.io/repo-name/`

### Option 3: Netlify / Vercel
Drop the folder — instant deploy.

---

## 🔑 Admin Login
- **URL**: `index.html` → click "Admin" button → goes to `admin.html`
- **Default password**: `admin@123`
- Change password in Admin → Settings

---

## ⚠️ Important Notes

- **APK data** is stored as base64 in localStorage (~5MB limit per domain)
- For large APK files (>5MB), consider hosting APKs elsewhere and storing just the URL
- Data is **per-browser** — not synced across devices (no backend)
- For production use: replace `db.js` with a real backend API (Firebase, Supabase, etc.)

---

## 🛠 Customization

- Edit `DB.KEYS` in `db.js` to change localStorage key names
- Edit sample apps in `DB.init()` in `db.js`
- Colors/theme: Edit CSS variables in `style.css` (`:root` block)
- Categories: Edit `Utils.CATEGORIES` array in `db.js`

---

Made with ❤️ — Pure HTML/CSS/JS, no frameworks, Git-friendly.
