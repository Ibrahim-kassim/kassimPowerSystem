const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Create a middleware to check admin role
const adminCheck = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
    next();
};

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.use(protect); // All routes below this will be protected

// Admin only routes
router.route('/')
    .get(adminCheck, getUsers);

router.route('/:id')
    .get(adminCheck, getUserById)
    .put(adminCheck, updateUser)
    .delete(adminCheck, deleteUser);

module.exports = router;
