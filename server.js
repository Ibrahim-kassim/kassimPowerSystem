const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const { errorHandler } = require('./middleware/error');

// Load env vars
dotenv.config();

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', async (req, res) => {
    try {
        await connectDB();
        res.json({ status: 'ok', message: 'API is running' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/jobnumbers', require('./routes/jobNumberRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/fixedassets', require('./routes/fixedAssetRoutes'));
app.use('/api/chartofaccounts', require('./routes/chartOfAccountRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/purchaserequisitions', require('./routes/purchaseRequisitionRoutes'));
app.use('/api/purchaseorders', require('./routes/purchaseOrderRoutes'));
app.use('/api/attachments', require('./routes/attachmentRoutes'));

// Error Handler (should be last piece of middleware)
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
