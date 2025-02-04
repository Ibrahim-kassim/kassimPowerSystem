const express = require('express');
const router = express.Router();
const FixedAsset = require('../models/FixedAsset');
const { protect } = require('../middleware/auth');

// @desc    Get all fixed assets
// @route   GET /api/fixedassets
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const fixedAssets = await FixedAsset.find();
        res.json(fixedAssets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single fixed asset
// @route   GET /api/fixedassets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const fixedAsset = await FixedAsset.findById(req.params.id);
        if (!fixedAsset) {
            return res.status(404).json({ message: 'Fixed asset not found' });
        }
        res.json(fixedAsset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new fixed asset
// @route   POST /api/fixedassets
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const fixedAsset = new FixedAsset(req.body);
        const savedAsset = await fixedAsset.save();
        res.status(201).json(savedAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update fixed asset
// @route   PUT /api/fixedassets/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const fixedAsset = await FixedAsset.findById(req.params.id);
        if (!fixedAsset) {
            return res.status(404).json({ message: 'Fixed asset not found' });
        }

        const updatedAsset = await FixedAsset.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json(updatedAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete fixed asset
// @route   DELETE /api/fixedassets/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const fixedAsset = await FixedAsset.findById(req.params.id);
        if (!fixedAsset) {
            return res.status(404).json({ message: 'Fixed asset not found' });
        }

        await fixedAsset.deleteOne();
        res.json({ message: 'Fixed asset removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add maintenance record
// @route   POST /api/fixedassets/:id/maintenance
// @access  Private
router.post('/:id/maintenance', protect, async (req, res) => {
    try {
        const fixedAsset = await FixedAsset.findById(req.params.id);
        if (!fixedAsset) {
            return res.status(404).json({ message: 'Fixed asset not found' });
        }

        fixedAsset.maintenanceHistory.push(req.body);
        const updatedAsset = await fixedAsset.save();
        res.status(201).json(updatedAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
