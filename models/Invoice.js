const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: [true, 'Invoice number is required'],
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required']
    },
    quotationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation',
        required: [true, 'Quotation is required']
    },
    jobNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobNumber',
        required: [true, 'Job number is required']
    },
    items: [{
        description: {
            type: String,
            required: [true, 'Item description is required'],
            trim: true
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: 0
        },
        unitPrice: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: 0
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    }
}, {
    timestamps: true
});

// Create indexes without duplicates
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ company: 1 });
invoiceSchema.index({ quotationId: 1 });
invoiceSchema.index({ jobNumber: 1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
