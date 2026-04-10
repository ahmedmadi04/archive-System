const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
    body().custom((value, { req }) => {
        const { email, username } = req.body;

        if (!email && !username) {
            throw new Error('Email or username is required');
        }

        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            throw new Error('Please provide a valid email');
        }

        if (username && username.trim().length < 3) {
            throw new Error('Please provide a valid username');
        }

        return true;
    }),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', auth, authController.logout);
router.get('/profile', auth, authController.getProfile);
router.get('/check-auth', auth, authController.getProfile);
router.post('/check-auth', auth, authController.getProfile);

module.exports = router;