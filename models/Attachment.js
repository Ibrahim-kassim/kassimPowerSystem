const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: [true, 'File name is required'],
        trim: true
    },
    originalName: {
        type: String,
        required: [true, 'Original file name is required'],
        trim: true
    },
    mimeType: {
        type: String,
        required: [true, 'File type is required'],
        trim: true
    },
    size: {
        type: Number,
        required: [true, 'File size is required']
    },
    path: {
        type: String,
        required: [true, 'File path is required'],
        trim: true
    },
    module: {
        type: String,
        required: [true, 'Module is required'],
        enum: [
            'Quotation',
            'Invoice',
            'FixedAsset',
            'PurchaseRequisition',
            'PurchaseOrder',
            'Vendor',
            'Company',
            'JobNumber',
            'Contact',
            'Product'
        ]
    },
    documentType: {
        type: String,
        required: [true, 'Document type is required'],
        trim: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Reference ID is required'],
        refPath: 'module'
    },
    description: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Archived', 'Deleted'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Define the mapping between modules and their mongoose models
attachmentSchema.statics.moduleMapping = {
    'Quotation': 'Quotation',
    'Invoice': 'Invoice',
    'FixedAsset': 'FixedAsset',
    'PurchaseRequisition': 'PurchaseRequisition',
    'PurchaseOrder': 'PurchaseOrder',
    'Vendor': 'Vendor',
    'Company': 'Company',
    'JobNumber': 'JobNumber',
    'Contact': 'Contact',
    'Product': 'Product'
};

// Method to validate if reference exists in the specified module
attachmentSchema.methods.validateReference = async function() {
    const ModelName = this.constructor.moduleMapping[this.module];
    if (!ModelName) {
        throw new Error('Invalid module specified');
    }

    const Model = mongoose.model(ModelName);
    const reference = await Model.findById(this.referenceId);
    if (!reference) {
        throw new Error(`Referenced ${this.module} not found`);
    }
    return true;
};

// Pre-save middleware to validate reference
attachmentSchema.pre('save', async function(next) {
    if (this.isModified('referenceId') || this.isModified('module')) {
        await this.validateReference();
    }
    next();
});

// Indexes for better query performance
attachmentSchema.index({ referenceId: 1, module: 1 });
attachmentSchema.index({ company: 1 });
attachmentSchema.index({ uploadedBy: 1 });
attachmentSchema.index({ fileName: 1 });
attachmentSchema.index({ tags: 1 });
attachmentSchema.index({ status: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
