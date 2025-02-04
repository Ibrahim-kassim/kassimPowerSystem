const JobNumber = require('../models/JobNumber');

// @desc    Generate next job number
// @route   GET /api/jobnumbers/generate/:type
// @access  Private
const generateJobNumber = async (req, res) => {
    try {
        const { type } = req.params;
        const currentYear = new Date().getFullYear();

        // Find the latest number for this type and year
        const latestNumber = await JobNumber.findOne({
            type,
            year: currentYear
        }).sort({ sequence: -1 });

        // Calculate next sequence number
        const nextSequence = latestNumber ? latestNumber.sequence + 1 : 0;

        // Generate the number string
        const number = `${type}_${currentYear}_${nextSequence}`;

        // Create new job number entry
        const jobNumber = await JobNumber.create({
            number,
            type,
            year: currentYear,
            sequence: nextSequence
        });

        res.json(jobNumber);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all job numbers
// @route   GET /api/jobnumbers
// @access  Private
const getJobNumbers = async (req, res) => {
    try {
        const query = {};

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by year
        if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        const jobNumbers = await JobNumber.find(query)
            .sort({ createdAt: -1 });

        res.json(jobNumbers);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get job number by ID
// @route   GET /api/jobnumbers/:id
// @access  Private
const getJobNumberById = async (req, res) => {
    try {
        const jobNumber = await JobNumber.findById(req.params.id);
        
        if (!jobNumber) {
            return res.status(404).json({ message: 'Job number not found' });
        }

        res.json(jobNumber);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update reference (quotation, invoice, company, procurement, fixedAsset)
// @route   PATCH /api/jobnumbers/:number/reference
// @access  Private
const updateReference = async (req, res) => {
    try {
        const { number } = req.params;
        const { field, value } = req.body;

        // Validate field name
        const validFields = ['quotation_ref', 'invoice_ref', 'company_ref', 'procurement_ref', 'fixedAsset_ref'];
        if (!validFields.includes(field)) {
            return res.status(400).json({ message: 'Invalid reference field' });
        }

        const jobNumber = await JobNumber.findOne({ number });
        if (!jobNumber) {
            return res.status(404).json({ message: 'Job number not found' });
        }

        // Update the reference
        jobNumber[field] = value;
        await jobNumber.save();

        res.json(jobNumber);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    generateJobNumber,
    getJobNumbers,
    getJobNumberById,
    updateReference
};
