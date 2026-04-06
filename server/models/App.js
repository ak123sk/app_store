const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'App name is required'],
        trim: true,
        maxlength: [100, 'App name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    version: {
        type: String,
        required: [true, 'Version is required'],
        trim: true,
        match: [/^\d+\.\d+\.\d+$/, 'Please use semantic versioning (e.g., 1.0.0)']
    },
    developer: {
        type: String,
        required: [true, 'Developer name is required'],
        trim: true,
        maxlength: [100, 'Developer name cannot exceed 100 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Games', 'Productivity', 'Social', 'Entertainment', 'Education', 'Tools', 'Other']
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    iconUrl: {
        type: String,
        default: '/assets/images/default-icon.png'
    },
    screenshots: [{
        type: String
    }],
    downloads: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    requiresAndroid: {
        type: String,
        default: '4.4+'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
appSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for search
appSchema.index({ name: 'text', description: 'text', developer: 'text' });

module.exports = mongoose.model('App', appSchema);
