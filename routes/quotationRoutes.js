const express = require('express');
const router = express.Router();
const {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    updateQuotationStatus,
    convertQuotation
} = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Standard CRUD routes
router.route('/')
    .post(createQuotation)
    .get(getQuotations);

router.route('/:id')
    .get(getQuotationById)
    .put(updateQuotation)
    .delete(deleteQuotation);

// Special routes
router.patch('/:id/status', updateQuotationStatus);
router.patch('/:id/convert', convertQuotation);

module.exports = router;
