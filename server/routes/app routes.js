const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// Public routes
router.get('/', appController.getAllApps);
router.get('/featured', appController.getFeaturedApps);
router.get('/category/:category', appController.getAppsByCategory);
router.get('/:id', appController.getAppById);
router.get('/:id/download', appController.downloadApp);

module.exports = router;
