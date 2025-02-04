const mongoose = require('mongoose');

const jobNumberSchema = new mongoose.Schema({
    number: {
        type: String,
        required: [true, 'Job number is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['Q', 'W', 'M', 'S'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Year is required']
    },
    sequence: {
        type: Number,
        required: [true, 'Sequence is required']
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Create compound index for type and year
jobNumberSchema.index({ type: 1, year: 1 });
// Create index for number without duplicate definition
jobNumberSchema.index({ number: 1 }, { unique: true });

const JobNumber = mongoose.model('JobNumber', jobNumberSchema);

module.exports = JobNumber;
