const express = require('express');
const router = express.Router();
const {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany
} = require('../controllers/companyController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
    .post(createCompany)
    .get(getCompanies);

router.route('/:id')
    .get(getCompanyById)
    .put(updateCompany)
    .delete(deleteCompany);

module.exports = router;
