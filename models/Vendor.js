const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    vendorCode: {
        type: String,
        required: [true, 'Vendor code is required'],
        unique: true,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required']
    },
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    taxId: {
        type: String,
        trim: true
    },
    paymentTerms: {
        type: String,
        trim: true
    },
    accountPayable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccount',
        required: [true, 'Account Payable is required']
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Blacklisted'],
        default: 'Active'
    },
    category: [{
        type: String,
        trim: true
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

vendorSchema.index({ vendorCode: 1, company: 1 }, { unique: true });
vendorSchema.index({ name: 1 });
vendorSchema.index({ status: 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
