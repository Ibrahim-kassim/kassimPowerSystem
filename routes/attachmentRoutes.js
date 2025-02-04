const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const Attachment = require('../models/Attachment');
const { protect } = require('../middleware/auth');

// Use memory storage for Vercel deployment
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function(req, file, cb) {
        // Allow only certain file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type!'));
    }
});

// @desc    Upload new attachment
// @route   POST /api/attachments
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const attachment = new Attachment({
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            data: req.file.buffer,
            module: req.body.module,
            documentType: req.body.documentType,
            referenceId: req.body.referenceId,
            description: req.body.description,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            uploadedBy: req.user.id,
            company: req.body.company
        });

        const savedAttachment = await attachment.save();
        res.status(201).json(savedAttachment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get all attachments with filtering
// @route   GET /api/attachments
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const query = { company: req.query.company };
        
        // Add optional filters
        if (req.query.module) query.module = req.query.module;
        if (req.query.documentType) query.documentType = req.query.documentType;
        if (req.query.referenceId) query.referenceId = req.query.referenceId;
        if (req.query.status) query.status = req.query.status;
        if (req.query.tags) {
            const tags = req.query.tags.split(',');
            query.tags = { $in: tags };
        }

        const attachments = await Attachment.find(query)
            .populate('uploadedBy', 'userName')
            .populate('referenceId')
            .sort('-createdAt');
        res.json(attachments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get attachments for a specific module and reference
// @route   GET /api/attachments/byreference/:module/:referenceId
// @access  Private
router.get('/byreference/:module/:referenceId', protect, async (req, res) => {
    try {
        const attachments = await Attachment.find({
            module: req.params.module,
            referenceId: req.params.referenceId,
            company: req.query.company
        })
        .populate('uploadedBy', 'userName')
        .sort('-createdAt');
        
        res.json(attachments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single attachment
// @route   GET /api/attachments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id)
            .populate('uploadedBy', 'userName')
            .populate('referenceId');
        
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }
        res.json(attachment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Download attachment
// @route   GET /api/attachments/:id/download
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id);
        
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Set content disposition and type
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        res.setHeader('Content-Type', attachment.mimeType);

        // Stream the file
        res.send(attachment.data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update attachment
// @route   PUT /api/attachments/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Only allow updating certain fields
        const allowedUpdates = ['description', 'status', 'tags', 'documentType'];
        const updates = {};
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const updatedAttachment = await Attachment.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate('uploadedBy', 'userName')
         .populate('referenceId');

        res.json(updatedAttachment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete attachment
// @route   DELETE /api/attachments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        await attachment.deleteOne();
        res.json({ message: 'Attachment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
