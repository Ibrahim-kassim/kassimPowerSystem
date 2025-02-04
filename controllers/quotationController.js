const Quotation = require('../models/Quotation');
const Company = require('../models/Company');
const Contact = require('../models/Contact');

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = async (req, res) => {
    try {
        // Check if company exists
        const company = await Company.findById(req.body.company);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if contact exists
        const contact = await Contact.findById(req.body.contact);
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Add user id to quotation data
        req.body.createdBy = req.user.id;

        // Set default validUntil date if not provided (30 days from now)
        if (!req.body.validUntil) {
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 30);
            req.body.validUntil = validUntil;
        }

        // Calculate product totals
        if (req.body.products) {
            req.body.products = req.body.products.map(product => ({
                ...product,
                total: product.quantity * product.unitPrice
            }));
        }

        const quotation = await Quotation.create(req.body);
        
        await quotation.populate([
            { path: 'company', select: 'name email phone' },
            { path: 'contact', select: 'name email phone' },
            { path: 'createdBy', select: 'userName' }
        ]);

        res.status(201).json(quotation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
    try {
        const query = {};
        
        // Filter by company if provided
        if (req.query.company) {
            query.company = req.query.company;
        }

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            query.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Filter by converted status
        if (req.query.converted !== undefined) {
            query.converted = req.query.converted === 'true';
        }

        const quotations = await Quotation.find(query)
            .populate('company', 'name email phone')
            .populate('contact', 'name email phone')
            .populate('createdBy', 'userName')
            .sort({ createdAt: -1 });
        
        res.json(quotations);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('company', 'name email phone')
            .populate('contact', 'name email phone')
            .populate('createdBy', 'userName');
        
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        res.json(quotation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Check if user has permission to update
        if (quotation.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this quotation' });
        }

        // Calculate product totals if products are being updated
        if (req.body.products) {
            req.body.products = req.body.products.map(product => ({
                ...product,
                total: product.quantity * product.unitPrice
            }));
        }

        const updatedQuotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('company', 'name email phone')
            .populate('contact', 'name email phone')
            .populate('createdBy', 'userName');

        res.json(updatedQuotation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
const deleteQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Check if user has permission to delete
        if (quotation.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this quotation' });
        }

        await quotation.deleteOne();
        res.json({ message: 'Quotation removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update quotation status
// @route   PATCH /api/quotations/:id/status
// @access  Private
const updateQuotationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        quotation.status = status;
        await quotation.save();

        res.json({ message: 'Quotation status updated', status });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Convert quotation
// @route   PATCH /api/quotations/:id/convert
// @access  Private
const convertQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        if (quotation.converted) {
            return res.status(400).json({ message: 'Quotation already converted' });
        }

        quotation.converted = true;
        quotation.status = 'accepted';
        await quotation.save();

        res.json({ message: 'Quotation converted successfully', quotation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    updateQuotationStatus,
    convertQuotation
};
