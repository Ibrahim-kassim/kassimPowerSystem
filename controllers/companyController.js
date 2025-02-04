const Company = require('../models/Company');

// @desc    Create new company
// @route   POST /api/companies
// @access  Private
const createCompany = async (req, res) => {
    try {
        // Add user id to company data
        req.body.createdBy = req.user.id;

        const company = await Company.create(req.body);
        res.status(201).json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = async (req, res) => {
    try {
        const query = {};
        
        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by country if provided
        if (req.query.country) {
            query['address.country'] = req.query.country;
        }

        const companies = await Company.find(query)
            .populate('createdBy', 'userName role');
        
        res.json(companies);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('createdBy', 'userName role');
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private
const updateCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user has permission to update
        if (company.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this company' });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'userName role');

        res.json(updatedCompany);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private
const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user has permission to delete
        if (company.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this company' });
        }

        await company.deleteOne();
        res.json({ message: 'Company removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany
};
