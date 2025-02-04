const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
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
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    accountCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccount',
        required: true
    },
    receivedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: String
});

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
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
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    purchaseRequisition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseRequisition'
    },
    jobNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobNumber'
    },
    orderDate: {
        type: Date,
        required: true
    },
    expectedDeliveryDate: {
        type: Date,
        required: true
    },
    items: [poItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxTotal: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Partially Received', 'Fully Received', 'Cancelled'],
        default: 'Draft'
    },
    paymentTerms: {
        type: String,
        required: true,
        trim: true
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
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

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().substr(-2);
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        
        // Find the last PO number for the current year/month
        const lastPO = await this.constructor.findOne({
            poNumber: new RegExp(`^PO${year}${month}`)
        }).sort({ poNumber: -1 });

        let sequence = '0001';
        if (lastPO) {
            const lastSequence = parseInt(lastPO.poNumber.slice(-4));
            sequence = (lastSequence + 1).toString().padStart(4, '0');
        }

        this.poNumber = `PO${year}${month}${sequence}`;
    }
    next();
});

// Method to update received quantities
purchaseOrderSchema.methods.updateReceived = async function(itemUpdates) {
    let fullyReceived = true;
    
    this.items = this.items.map(item => {
        const update = itemUpdates.find(u => u._id.toString() === item._id.toString());
        if (update) {
            item.receivedQuantity = update.receivedQuantity;
            if (item.receivedQuantity < item.quantity) {
                fullyReceived = false;
            }
        }
        return item;
    });

    this.status = fullyReceived ? 'Fully Received' : 'Partially Received';
    return this.save();
};

// Indexes
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ company: 1 });
purchaseOrderSchema.index({ vendor: 1 });
purchaseOrderSchema.index({ status: 1 });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
