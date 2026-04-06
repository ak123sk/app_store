const App = require('../models/App');
const { generateAdminToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

// Admin login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === process.env.ADMIN_USERNAME && 
            password === process.env.ADMIN_PASSWORD) {
            const token = generateAdminToken();
            res.json({
                success: true,
                token,
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login error',
            error: error.message
        });
    }
};

// Create new app
exports.createApp = async (req, res) => {
    try {
        // Sanitize input
        const sanitizedData = {
            name: sanitizeHtml(req.body.name),
            description: sanitizeHtml(req.body.description),
            version: sanitizeHtml(req.body.version),
            developer: sanitizeHtml(req.body.developer),
            category: req.body.category,
            requiresAndroid: req.body.requiresAndroid
        };
        
        const app = new App({
            ...sanitizedData,
            fileSize: req.file.size,
            filePath: req.file.path,
            fileName: req.file.originalname,
            iconUrl: req.body.iconUrl || '/assets/images/default-icon.png'
        });
        
        await app.save();
        
        res.status(201).json({
            success: true,
            data: app,
            message: 'App created successfully'
        });
    } catch (error) {
        // Clean up uploaded file if error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(400).json({
            success: false,
            message: 'Error creating app',
            error: error.message
        });
    }
};

// Update app
exports.updateApp = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'description', 'version', 'developer', 'category', 'requiresAndroid', 'isActive'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
            return res.status(400).json({
                success: false,
                message: 'Invalid updates'
            });
        }
        
        const app = await App.findById(req.params.id);
        
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }
        
        updates.forEach(update => {
            if (req.body[update] !== undefined) {
                app[update] = sanitizeHtml(req.body[update]);
            }
        });
        
        await app.save();
        
        res.json({
            success: true,
            data: app,
            message: 'App updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating app',
            error: error.message
        });
    }
};

// Delete app
exports.deleteApp = async (req, res) => {
    try {
        const app = await App.findById(req.params.id);
        
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }
        
        // Delete APK file
        if (fs.existsSync(app.filePath)) {
            fs.unlinkSync(app.filePath);
        }
        
        await app.deleteOne();
        
        res.json({
            success: true,
            message: 'App deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting app',
            error: error.message
        });
    }
};

// Get all apps (including inactive) for admin
exports.getAllAppsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        const apps = await App.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await App.countDocuments({});
        
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

// Get app statistics
exports.getStats = async (req, res) => {
    try {
        const totalApps = await App.countDocuments({});
        const totalDownloads = await App.aggregate([
            { $group: { _id: null, total: { $sum: '$downloads' } } }
        ]);
        const categories = await App.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        res.json({
            success: true,
            data: {
                totalApps,
                totalDownloads: totalDownloads[0]?.total || 0,
                categories
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};
