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

const invoiceSchema = new mongoose.Schema({
    invoice_id: {
        type: String,
        unique: true,
        sparse: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    jobNumber: {
        type: String,
        required: true,
        unique: true
    },
    products: [productSchema],
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
    convertedFromQuotation: {
        type: Boolean,
        default: false
    },
    quotationId: {
        type: String,
        sparse: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Auto-generate invoice_id before saving
invoiceSchema.pre('save', async function(next) {
    if (!this.invoice_id) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get the count of documents for this month
        const count = await this.constructor.countDocuments({
            invoice_id: new RegExp(`^INV${year}${month}`)
        });
        
        // Generate invoice_id: INV[YY][MM][XXXX]
        this.invoice_id = `INV${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// Calculate totals before saving
invoiceSchema.pre('save', function(next) {
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

// Create indexes
invoiceSchema.index({ company: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ jobNumber: 1 });
invoiceSchema.index({ quotationId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
