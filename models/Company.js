const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        unique: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    additionalInfo: {
        website: String,
        industry: String,
        employeeCount: Number,
        foundedYear: Number,
        description: String,
        taxId: String,
        registrationNumber: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
companySchema.index({ email: 1 });
companySchema.index({ 'address.country': 1 });
companySchema.index({ status: 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
