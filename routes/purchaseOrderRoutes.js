const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const { protect } = require('../middleware/auth');

// @desc    Get all purchase orders
// @route   GET /api/purchaseorders
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const orders = await PurchaseOrder.find({ company: req.query.company })
            .populate('vendor')
            .populate('purchaseRequisition')
            .populate('jobNumber')
            .populate('items.accountCode');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single purchase order
// @route   GET /api/purchaseorders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id)
            .populate('vendor')
            .populate('purchaseRequisition')
            .populate('jobNumber')
            .populate('items.accountCode')
            .populate('approvalHistory.approver', 'userName');
        
        if (!order) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new purchase order
// @route   POST /api/purchaseorders
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const order = new PurchaseOrder(req.body);
        
        // If created from PR, update PR status
        if (req.body.purchaseRequisition) {
            await PurchaseRequisition.findByIdAndUpdate(
                req.body.purchaseRequisition,
                { status: 'Converted to PO' }
            );
        }

        const savedOrder = await order.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update purchase order
// @route   PUT /api/purchaseorders/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        // Don't allow updates if PO is already sent
        if (['Sent', 'Partially Received', 'Fully Received'].includes(order.status)) {
            return res.status(400).json({ 
                message: 'Cannot update sent or received purchase order' 
            });
        }

        const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('vendor')
         .populate('purchaseRequisition')
         .populate('jobNumber')
         .populate('items.accountCode')
         .populate('approvalHistory.approver', 'userName');

        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete purchase order
// @route   DELETE /api/purchaseorders/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        // Don't allow deletion if PO is already sent
        if (['Sent', 'Partially Received', 'Fully Received'].includes(order.status)) {
            return res.status(400).json({ 
                message: 'Cannot delete sent or received purchase order' 
            });
        }

        await order.deleteOne();
        res.json({ message: 'Purchase order removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add approval to purchase order
// @route   POST /api/purchaseorders/:id/approve
// @access  Private
router.post('/:id/approve', protect, async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        const approval = {
            approver: req.user.id,
            status: req.body.status,
            comments: req.body.comments
        };

        order.approvalHistory.push(approval);
        if (req.body.status === 'Approved') {
            order.status = 'Sent';
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update received quantities
// @route   POST /api/purchaseorders/:id/receive
// @access  Private
router.post('/:id/receive', protect, async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        await order.updateReceived(req.body.items);
        
        const updatedOrder = await PurchaseOrder.findById(req.params.id)
            .populate('vendor')
            .populate('purchaseRequisition')
            .populate('jobNumber')
            .populate('items.accountCode')
            .populate('approvalHistory.approver', 'userName');

        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
