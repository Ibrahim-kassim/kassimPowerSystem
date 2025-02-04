const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true
    }
});

// Job Number Schema
const jobNumberSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    quotationRef: {
        type: String,
        required: true
    },
    jobName: {
        type: String,
        required: true
    },
    jobNature: {
        type: String,
        required: true
    }
});

const quotationSchema = new mongoose.Schema({
    quotationId: {
        type: String,
        required: [true, 'Quotation ID is required'],
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required']
    },
    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true
    },
    products: [productSchema],
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
        default: 'draft'
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    subTotal: {
        type: Number,
        default: 0
    },
    vatPercentage: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100
    },
    vatAmount: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'fixed'
    },
    discountValue: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        default: 0
    },
    converted: {
        type: Boolean,
        default: false
    },
    jobNumber: jobNumberSchema,
    validUntil: {
        type: Date,
        required: true,
        default: () => {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    },
    termsAndConditions: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Auto-generate quotationId before saving
quotationSchema.pre('save', async function(next) {
    if (!this.quotationId) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get the count of documents for this month
        const count = await this.constructor.countDocuments({
            quotationId: new RegExp(`^QT${year}${month}`)
        });
        
        // Generate quotationId: QT[YY][MM][XXXX]
        this.quotationId = `QT${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// Calculate totals before saving
quotationSchema.pre('save', function(next) {
    // Calculate subtotal
    this.subTotal = this.products.reduce((sum, product) => sum + product.total, 0);

    // Calculate VAT amount
    this.vatAmount = (this.subTotal * this.vatPercentage) / 100;

    // Calculate discount amount
    if (this.discountType === 'percentage') {
        this.discountAmount = (this.subTotal * this.discountValue) / 100;
    } else {
        this.discountAmount = this.discountValue;
    }

    // Calculate grand total
    this.grandTotal = this.subTotal + this.vatAmount - this.discountAmount;

    next();
});

// Create indexes without duplicates
quotationSchema.index({ quotationId: 1 }, { unique: true });
quotationSchema.index({ company: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ createdAt: -1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
