const mongoose = require('mongoose');

const fixedAssetSchema = new mongoose.Schema({
    assetName: {
        type: String,
        required: [true, 'Asset name is required'],
        trim: true
    },
    assetCode: {
        type: String,
        required: [true, 'Asset code is required'],
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required']
    },
    accountCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccount',
        required: [true, 'Chart of Account code is required']
    },
    jobNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobNumber',
        required: false
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    purchaseDate: {
        type: Date,
        required: [true, 'Purchase date is required']
    },
    purchasePrice: {
        type: Number,
        required: [true, 'Purchase price is required']
    },
    currentValue: {
        type: Number,
        required: [true, 'Current value is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor'],
        default: 'Good'
    },
    depreciationMethod: {
        type: String,
        enum: ['Straight Line', 'Declining Balance', 'Sum of Years'],
        required: true
    },
    depreciationRate: {
        type: Number,
        required: true
    },
    usefulLife: {
        type: Number, // in years
        required: true
    },
    maintenanceHistory: [{
        date: Date,
        description: String,
        cost: Number,
        performedBy: String
    }],
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Under Maintenance', 'Disposed', 'Retired'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Create indexes without duplicates
fixedAssetSchema.index({ assetCode: 1 }, { unique: true });
fixedAssetSchema.index({ category: 1 });
fixedAssetSchema.index({ department: 1 });
fixedAssetSchema.index({ status: 1 });

const FixedAsset = mongoose.model('FixedAsset', fixedAssetSchema);

module.exports = FixedAsset;
