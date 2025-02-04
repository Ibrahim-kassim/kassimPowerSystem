const express = require('express');
const router = express.Router();
const PurchaseRequisition = require('../models/PurchaseRequisition');
const { protect } = require('../middleware/auth');

// @desc    Get all purchase requisitions
// @route   GET /api/purchaserequisitions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const requisitions = await PurchaseRequisition.find({ company: req.query.company })
            .populate('requestedBy', 'userName')
            .populate('jobNumber')
            .populate('items.accountCode');
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single purchase requisition
// @route   GET /api/purchaserequisitions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const requisition = await PurchaseRequisition.findById(req.params.id)
            .populate('requestedBy', 'userName')
            .populate('jobNumber')
            .populate('items.accountCode')
            .populate('approvalHistory.approver', 'userName');
        
        if (!requisition) {
            return res.status(404).json({ message: 'Purchase requisition not found' });
        }
        res.json(requisition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new purchase requisition
// @route   POST /api/purchaserequisitions
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const requisition = new PurchaseRequisition({
            ...req.body,
            requestedBy: req.user.id
        });
        const savedRequisition = await requisition.save();
        res.status(201).json(savedRequisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update purchase requisition
// @route   PUT /api/purchaserequisitions/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const requisition = await PurchaseRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Purchase requisition not found' });
        }

        // Don't allow updates if PR is already approved or converted to PO
        if (['Approved', 'Converted to PO'].includes(requisition.status)) {
            return res.status(400).json({ 
                message: 'Cannot update approved or converted purchase requisition' 
            });
        }

        const updatedRequisition = await PurchaseRequisition.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('requestedBy', 'userName')
         .populate('jobNumber')
         .populate('items.accountCode')
         .populate('approvalHistory.approver', 'userName');

        res.json(updatedRequisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete purchase requisition
// @route   DELETE /api/purchaserequisitions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const requisition = await PurchaseRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Purchase requisition not found' });
        }

        // Don't allow deletion if PR is already approved or converted to PO
        if (['Approved', 'Converted to PO'].includes(requisition.status)) {
            return res.status(400).json({ 
                message: 'Cannot delete approved or converted purchase requisition' 
            });
        }

        await requisition.deleteOne();
        res.json({ message: 'Purchase requisition removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add approval to purchase requisition
// @route   POST /api/purchaserequisitions/:id/approve
// @access  Private
router.post('/:id/approve', protect, async (req, res) => {
    try {
        const requisition = await PurchaseRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Purchase requisition not found' });
        }

        const approval = {
            approver: req.user.id,
            status: req.body.status,
            comments: req.body.comments
        };

        requisition.approvalHistory.push(approval);
        requisition.status = req.body.status === 'Approved' ? 'Approved' : 'Rejected';

        const updatedRequisition = await requisition.save();
        res.json(updatedRequisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
