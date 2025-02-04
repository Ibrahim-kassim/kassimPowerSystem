const mongoose = require('mongoose');

const requisitionItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    estimatedUnitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    estimatedTotalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    accountCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccount',
        required: true
    },
    notes: String
});

const purchaseRequisitionSchema = new mongoose.Schema({
    prNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    jobNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobNumber'
    },
    requiredDate: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    items: [requisitionItemSchema],
    totalEstimatedAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Converted to PO', 'Cancelled'],
        default: 'Draft'
    },
    approvalHistory: [{
        approver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['Approved', 'Rejected']
        },
        date: {
            type: Date,
            default: Date.now
        },
        comments: String
    }],
    attachments: [{
        filename: String,
        path: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Auto-generate PR number
purchaseRequisitionSchema.pre('save', async function(next) {
    if (this.isNew) {
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().substr(-2);
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        
        // Find the last PR number for the current year/month
        const lastPR = await this.constructor.findOne({
            prNumber: new RegExp(`^PR${year}${month}`)
        }).sort({ prNumber: -1 });

        let sequence = '0001';
        if (lastPR) {
            const lastSequence = parseInt(lastPR.prNumber.slice(-4));
            sequence = (lastSequence + 1).toString().padStart(4, '0');
        }

        this.prNumber = `PR${year}${month}${sequence}`;
    }
    next();
});

// Indexes
purchaseRequisitionSchema.index({ prNumber: 1 });
purchaseRequisitionSchema.index({ company: 1 });
purchaseRequisitionSchema.index({ status: 1 });
purchaseRequisitionSchema.index({ requestedBy: 1 });

const PurchaseRequisition = mongoose.model('PurchaseRequisition', purchaseRequisitionSchema);

module.exports = PurchaseRequisition;
