const App = require('../models/App');
const path = require('path');
const fs = require('fs');

// Get all active apps with pagination and search
exports.getAllApps = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const category = req.query.category || '';
        
        let query = { isActive: true };
        
        if (search) {
            query.$text = { $search: search };
        }
        
        if (category && category !== 'All') {
            query.category = category;
        }
        
        const apps = await App.find(query)
            .sort({ downloads: -1, rating: -1 })
            .skip(skip)
            .limit(limit)
            .select('-filePath');
            
        const total = await App.countDocuments(query);
        
        res.json({
            success: true,
            data: apps,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching apps',
            error: error.message
        });
    }
};

// Get single app by ID
exports.getAppById = async (req, res) => {
    try {
        const app = await App.findById(req.params.id);
        
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }
        
        if (!app.isActive) {
            return res.status(403).json({
                success: false,
                message: 'This app is currently unavailable'
            });
        }
        
        res.json({
            success: true,
            data: app
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching app',
            error: error.message
        });
    }
};

// Download app and increment download count
exports.downloadApp = async (req, res) => {
    try {
        const app = await App.findById(req.params.id);
        
        if (!app || !app.isActive) {
            return res.status(404).json({
                success: false,
                message: 'App not found or unavailable'
            });
        }
        
        // Increment download count
        app.downloads += 1;
        await app.save();
        
        const filePath = path.join(__dirname, '..', app.filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'APK file not found'
            });
        }
        
        res.download(filePath, app.fileName);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error downloading app',
            error: error.message
        });
    }
};

// Get featured apps
exports.getFeaturedApps = async (req, res) => {
    try {
        const apps = await App.find({ isActive: true })
            .sort({ downloads: -1, rating: -1 })
            .limit(10)
            .select('-filePath');
            
        res.json({
            success: true,
            data: apps
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured apps',
            error: error.message
        });
    }
};

// Get apps by category
exports.getAppsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const apps = await App.find({ category, isActive: true })
            .sort({ downloads: -1 })
            .select('-filePath');
            
        res.json({
            success: true,
            data: apps
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching apps by category',
            error: error.message
        });
    }
};
