const Invoice = require('../models/Invoice');
const Company = require('../models/Company');
const JobNumber = require('../models/JobNumber');
const Quotation = require('../models/Quotation');

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
    try {
        // Check if company exists
        const company = await Company.findById(req.body.company);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Generate job number if not provided
        if (!req.body.jobNumber) {
            const jobNumberResponse = await JobNumber.create({
                type: 'INV',
                year: new Date().getFullYear(),
                sequence: await getNextSequence('INV')
            });
            req.body.jobNumber = jobNumberResponse.number;
        }

        // If converting from quotation
        if (req.body.convertFromQuotation) {
            const quotation = await Quotation.findOne({ quotation_id: req.body.quotationId });
            if (!quotation) {
                return res.status(404).json({ message: 'Quotation not found' });
            }
            
            // Copy relevant data from quotation
            req.body.company = quotation.company;
            req.body.products = quotation.products;
            req.body.currency = quotation.currency;
            req.body.vatPercentage = quotation.vatPercentage;
            req.body.discountType = quotation.discountType;
            req.body.discountValue = quotation.discountValue;
            req.body.convertedFromQuotation = true;
            
            // Update quotation status
            quotation.converted = true;
            await quotation.save();
        }

        // Add user id to invoice data
        req.body.createdBy = req.user.id;

        const invoice = await Invoice.create(req.body);
        
        // Update job number with invoice reference
        await JobNumber.findOneAndUpdate(
            { number: invoice.jobNumber },
            { invoice_ref: invoice.invoice_id }
        );

        await invoice.populate([
            { path: 'company', select: 'name email phone' },
            { path: 'createdBy', select: 'userName' }
        ]);

        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
    try {
        const query = {};
        
        // Filter by company
        if (req.query.company) {
            query.company = req.query.company;
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            query.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Filter by converted from quotation
        if (req.query.convertedFromQuotation !== undefined) {
            query.convertedFromQuotation = req.query.convertedFromQuotation === 'true';
        }

        const invoices = await Invoice.find(query)
            .populate('company', 'name email phone')
            .populate('createdBy', 'userName')
            .sort({ createdAt: -1 });
        
        res.json(invoices);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('company', 'name email phone')
            .populate('createdBy', 'userName');
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if user has permission to update
        if (invoice.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this invoice' });
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('company', 'name email phone')
            .populate('createdBy', 'userName');

        res.json(updatedInvoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if user has permission to delete
        if (invoice.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this invoice' });
        }

        // Remove invoice reference from job number
        await JobNumber.findOneAndUpdate(
            { number: invoice.jobNumber },
            { $unset: { invoice_ref: "" } }
        );

        await invoice.deleteOne();
        res.json({ message: 'Invoice removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Helper function to get next sequence number
async function getNextSequence(type) {
    const currentYear = new Date().getFullYear();
    const latestNumber = await JobNumber.findOne({
        type,
        year: currentYear
    }).sort({ sequence: -1 });

    return latestNumber ? latestNumber.sequence + 1 : 0;
}

module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice
};
