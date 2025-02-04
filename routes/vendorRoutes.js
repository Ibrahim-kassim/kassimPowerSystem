const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const vendors = await Vendor.find({ company: req.query.company })
            .populate('accountPayable');
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate('accountPayable');
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new vendor
// @route   POST /api/vendors
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const vendor = new Vendor(req.body);
        const savedVendor = await vendor.save();
        res.status(201).json(savedVendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('accountPayable');

        res.json(updatedVendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        await vendor.deleteOne();
        res.json({ message: 'Vendor removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
