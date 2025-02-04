const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: [true, 'Filename is required'],
        trim: true
    },
    contentType: {
        type: String,
        required: [true, 'Content type is required']
    },
    size: {
        type: Number,
        required: [true, 'File size is required']
    },
    data: {
        type: Buffer,
        required: [true, 'File data is required']
    },
    company: {
        type: String,
        required: [true, 'Company is required']
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
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Reference ID is required'],
        refPath: 'module'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    uploadedAt: {
        type: Date,
        default: Date.now
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

// Create indexes
attachmentSchema.index({ company: 1 });
attachmentSchema.index({ module: 1 });
attachmentSchema.index({ referenceId: 1 });
attachmentSchema.index({ uploadedBy: 1 });
attachmentSchema.index({ filename: 1 });
attachmentSchema.index({ status: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
