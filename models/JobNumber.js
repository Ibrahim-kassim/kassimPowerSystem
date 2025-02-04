const mongoose = require('mongoose');

const jobNumberSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['QUO', 'INV', 'COM', 'PRO', 'FIX']  // Types for different references
    },
    quotation_ref: {
        type: String,
        default: null
    },
    invoice_ref: {
        type: String,
        default: null
    },
    company_ref: {
        type: String,
        default: null
    },
    procurement_ref: {
        type: String,
        default: null
    },
    fixedAsset_ref: {
        type: String,
        default: null
    },
    year: {
        type: Number,
        required: true
    },
    sequence: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Create compound index for type and year for faster lookups
jobNumberSchema.index({ type: 1, year: 1 });

const JobNumber = mongoose.model('JobNumber', jobNumberSchema);

module.exports = JobNumber;
