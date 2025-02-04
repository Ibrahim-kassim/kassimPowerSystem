const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const Attachment = require('../models/Attachment');
const { protect } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Create company and module specific directory
        const companyDir = path.join(uploadDir, req.body.company, req.body.module);
        if (!fs.existsSync(companyDir)) {
            fs.mkdirSync(companyDir, { recursive: true });
        }
        cb(null, companyDir);
    },
    filename: function(req, file, cb) {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function(req, file, cb) {
        // Add any file type restrictions here if needed
        cb(null, true);
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
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
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
        // Clean up uploaded file if database save fails
        if (req.file) {
            await promisify(fs.unlink)(req.file.path);
        }
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

        // Check if file exists
        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        // Set content disposition and type
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        res.setHeader('Content-Type', attachment.mimeType);

        // Stream the file
        const fileStream = fs.createReadStream(attachment.path);
        fileStream.pipe(res);
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

        // Delete file from filesystem
        if (fs.existsSync(attachment.path)) {
            await promisify(fs.unlink)(attachment.path);
        }

        await attachment.deleteOne();
        res.json({ message: 'Attachment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
