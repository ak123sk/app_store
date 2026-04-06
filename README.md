# APK Store Application

A secure, full-featured APK store application with user and admin interfaces.

## Features

### User Features
- Browse and search apps
- Filter by category
- View app details
- Download APK files
- Responsive design
- Featured apps section

### Admin Features
- Secure admin authentication (JWT)
- Add/Edit/Delete apps
- Upload APK files
- View app statistics
- Manage app status (active/inactive)
- Pagination for app list

### Security Features
- JWT-based authentication
- Input sanitization (XSS prevention)
- Rate limiting
- Helmet.js security headers
- CORS protection
- File upload validation
- SQL injection prevention (using MongoDB)
- Secure password hashing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd apk-store
