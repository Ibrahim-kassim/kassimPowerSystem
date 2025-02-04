const express = require('express');
const router = express.Router();
const ChartOfAccount = require('../models/ChartOfAccount');
const { protect } = require('../middleware/auth');

// @desc    Get all accounts for a company
// @route   GET /api/chartofaccounts
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const accounts = await ChartOfAccount.find({ company: req.query.company })
            .populate('parent')
            .populate('children');
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get account hierarchy for a company
// @route   GET /api/chartofaccounts/hierarchy
// @access  Private
router.get('/hierarchy', protect, async (req, res) => {
    try {
        // Get all level 1 accounts first
        const rootAccounts = await ChartOfAccount.find({
            company: req.query.company,
            level: 1
        }).populate({
            path: 'children',
            populate: {
                path: 'children',
                populate: {
                    path: 'children'
                }
            }
        });
        res.json(rootAccounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new account
// @route   POST /api/chartofaccounts
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { parentId, level, ...accountData } = req.body;
        
        // Generate the next available code
        let parentCode = null;
        if (parentId) {
            const parentAccount = await ChartOfAccount.findById(parentId);
            if (!parentAccount) {
                return res.status(404).json({ message: 'Parent account not found' });
            }
            parentCode = parentAccount.code;
            
            // Update parent's isParent status
            parentAccount.isParent = true;
            await parentAccount.save();
        }

        const code = await ChartOfAccount.generateNextCode(parentCode, level);
        
        const account = new ChartOfAccount({
            ...accountData,
            code,
            level,
            parent: parentId
        });

        const savedAccount = await account.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update account
// @route   PUT /api/chartofaccounts/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const { code, level, parent, ...updateData } = req.body; // Prevent updating code, level, and parent
        const account = await ChartOfAccount.findById(req.params.id);
        
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Only allow updating non-structural properties
        const updatedAccount = await ChartOfAccount.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedAccount);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete account
// @route   DELETE /api/chartofaccounts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const account = await ChartOfAccount.findById(req.params.id);
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Check if account has children
        const children = await ChartOfAccount.countDocuments({ parent: req.params.id });
        if (children > 0) {
            return res.status(400).json({ message: 'Cannot delete account with children' });
        }

        await account.deleteOne();
        res.json({ message: 'Account removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get account by code
// @route   GET /api/chartofaccounts/code/:code
// @access  Private
router.get('/code/:code', protect, async (req, res) => {
    try {
        const account = await ChartOfAccount.findOne({
            code: req.params.code,
            company: req.query.company
        }).populate('parent').populate('children');
        
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        res.json(account);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
