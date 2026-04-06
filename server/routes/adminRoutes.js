const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Configure multer for APK uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        file.originalname.endsWith('.apk')) {
        cb(null, true);
    } else {
        cb(new Error('Only APK files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
    },
    fileFilter: fileFilter
});

// Public route
router.post('/login', adminController.login);

// Protected routes
router.use(adminAuth);
router.post('/apps', upload.single('apkFile'), adminController.createApp);
router.put('/apps/:id', adminController.updateApp);
router.delete('/apps/:id', adminController.deleteApp);
router.get('/apps', adminController.getAllAppsAdmin);
router.get('/stats', adminController.getStats);

module.exports = router;
