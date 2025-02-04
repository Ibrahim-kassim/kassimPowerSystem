const express = require('express');
const router = express.Router();
const {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
    getContactsByCompany
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Standard CRUD routes
router.route('/')
    .post(createContact)
    .get(getContacts);

router.route('/:id')
    .get(getContactById)
    .put(updateContact)
    .delete(deleteContact);

// Special route for getting contacts by company
router.get('/company/:companyId', getContactsByCompany);

module.exports = router;
