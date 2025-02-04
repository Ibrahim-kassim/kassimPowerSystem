const mongoose = require('mongoose');

const chartOfAccountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Account code is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    type: {
        type: String,
        required: true,
        enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccount',
        default: null
    },
    isParent: {
        type: Boolean,
        default: false
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required']
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    balance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for getting children
chartOfAccountSchema.virtual('children', {
    ref: 'ChartOfAccount',
    localField: '_id',
    foreignField: 'parent'
});

// Index for better query performance
chartOfAccountSchema.index({ code: 1, company: 1 }, { unique: true });
chartOfAccountSchema.index({ parent: 1 });
chartOfAccountSchema.index({ level: 1 });

// Method to generate next available code for a specific level and parent
chartOfAccountSchema.statics.generateNextCode = async function(parentCode = null, level) {
    const Company = this;
    let baseCode = '';
    let nextNumber = 1;

    if (parentCode) {
        baseCode = parentCode + '.';
        const lastAccount = await Company.findOne({
            code: new RegExp(`^${baseCode}\\d+$`),
            level: level
        }).sort({ code: -1 });

        if (lastAccount) {
            const lastNumber = parseInt(lastAccount.code.split('.').pop());
            nextNumber = lastNumber + 1;
        }
    } else {
        // For level 1 accounts
        const lastAccount = await Company.findOne({
            level: 1
        }).sort({ code: -1 });

        if (lastAccount) {
            nextNumber = parseInt(lastAccount.code) + 1;
        }
    }

    return parentCode ? `${baseCode}${nextNumber}` : `${nextNumber}`;
};

// Middleware to prevent deletion if account has children
chartOfAccountSchema.pre('remove', async function(next) {
    const children = await this.model('ChartOfAccount').countDocuments({ parent: this._id });
    if (children > 0) {
        next(new Error('Cannot delete account with children'));
    }
    next();
});

const ChartOfAccount = mongoose.model('ChartOfAccount', chartOfAccountSchema);

module.exports = ChartOfAccount;
