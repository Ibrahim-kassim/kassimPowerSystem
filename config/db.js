const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            isConnected = false;
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        isConnected = false;
        throw error;
    }
};

module.exports = connectDB;
