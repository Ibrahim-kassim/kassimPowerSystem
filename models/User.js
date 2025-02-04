const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        index: true // Explicitly define the index
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['erp', 'hr', 'wells', 'admin'],
        required: true
    },
    permissions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete']
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Drop existing indexes and recreate them
userSchema.statics.initIndexes = async function() {
    try {
        await this.collection.dropIndexes();
        await this.collection.createIndex({ userName: 1 }, { unique: true });
    } catch (error) {
        console.log('Index initialization error:', error);
    }
};

const User = mongoose.model('User', userSchema);

// Initialize indexes when the model is first loaded
User.initIndexes();

module.exports = User;
