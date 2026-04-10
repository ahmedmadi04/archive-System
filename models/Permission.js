const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Permission name is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    resource: {
        type: String,
        required: [true, 'Resource is required'],
        trim: true
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: ['create', 'read', 'update', 'delete', 'manage'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique resource-action combinations
permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);