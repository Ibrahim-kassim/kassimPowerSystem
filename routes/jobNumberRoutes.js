const express = require('express');
const router = express.Router();
const {
    generateJobNumber,
    getJobNumbers,
    getJobNumberById,
    updateReference
} = require('../controllers/jobNumberController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Generate new job number
router.get('/generate/:type', generateJobNumber);

// Get all job numbers with optional filters
router.get('/', getJobNumbers);

// Get specific job number
router.get('/:id', getJobNumberById);

// Update reference
router.patch('/:number/reference', updateReference);

module.exports = router;
