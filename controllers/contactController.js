const Contact = require('../models/Contact');
const Company = require('../models/Company');

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
const createContact = async (req, res) => {
    try {
        // Check if company exists
        const company = await Company.findById(req.body.company);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Add user id to contact data
        req.body.createdBy = req.user.id;

        const contact = await Contact.create(req.body);
        await contact.populate('company', 'name');
        await contact.populate('createdBy', 'userName');
        
        res.status(201).json(contact);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
const getContacts = async (req, res) => {
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

        const contacts = await Contact.find(query)
            .populate('company', 'name')
            .populate('createdBy', 'userName');
        
        res.json(contacts);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private
const getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id)
            .populate('company', 'name')
            .populate('createdBy', 'userName');
        
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json(contact);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
const updateContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Check if user has permission to update
        if (contact.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this contact' });
        }

        // If company is being updated, check if new company exists
        if (req.body.company) {
            const company = await Company.findById(req.body.company);
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }
        }

        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('company', 'name')
            .populate('createdBy', 'userName');

        res.json(updatedContact);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
const deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Check if user has permission to delete
        if (contact.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this contact' });
        }

        await contact.deleteOne();
        res.json({ message: 'Contact removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get contacts by company
// @route   GET /api/contacts/company/:companyId
// @access  Private
const getContactsByCompany = async (req, res) => {
    try {
        const contacts = await Contact.find({ company: req.params.companyId })
            .populate('company', 'name')
            .populate('createdBy', 'userName');
        
        res.json(contacts);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
    getContactsByCompany
};
