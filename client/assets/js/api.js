// API Configuration and Security
const API_CONFIG = {
    baseURL: '/devoloper/apk',
    endpoints: {
        apps: '/file',
        info: '/apk_info.json',
        experience: '/apk_exp.json',
        developer: '/developer.json'
    }
};

// Security utilities
class SecurityManager {
    static sanitizeInput(input) {
        return input.replace(/[<>'"]/g, '');
    }

    static validateURL(url) {
        const pattern = /^[a-zA-Z0-9\-_/.]+$/;
        return pattern.test(url);
    }

    static generateCSRFToken() {
        return crypto.randomUUID();
    }

    static encryptData(data, key) {
        // Simple encryption for demo (use proper encryption in production)
        return btoa(JSON.stringify(data));
    }

    static decryptData(encryptedData, key) {
        try {
            return JSON.parse(atob(encryptedData));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }
}

// API Service
class APIService {
    static async fetchJSON(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'X-CSRF-Token': SecurityManager.generateCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async fetchAppsInfo() {
        return await this.fetchJSON(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.info}`
        );
    }

    static async fetchAppsExperience() {
        return await this.fetchJSON(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.experience}`
        );
    }

    static async fetchDeveloperInfo() {
        return await this.fetchJSON(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.developer}`
        );
    }

    static getAPKDownloadURL(filename) {
        if (!SecurityManager.validateURL(filename)) {
            throw new Error('Invalid filename');
        }
        return `${API_CONFIG.baseURL}${API_CONFIG.endpoints.apps}/${filename}`;
    }

    static getLogoURL(filename) {
        if (!SecurityManager.validateURL(filename)) {
            throw new Error('Invalid filename');
        }
        return `${API_CONFIG.baseURL}/../logo/${filename}`;
    }
}

// Cache Manager
class CacheManager {
    static set(key, data, ttl = 3600000) { // 1 hour default
        const item = {
            data: SecurityManager.encryptData(data),
            expiry: Date.now() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    static get(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return SecurityManager.decryptData(parsed.data);
    }

    static clear() {
        localStorage.clear();
    }
}
