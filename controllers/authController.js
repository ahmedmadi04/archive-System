const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

const authController = {
    // User registration
    register: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { username, email, password, roleId } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or username already exists'
                });
            }

            // Get default role if not specified
            let userRole = roleId;
            if (!userRole) {
                const defaultRole = await Role.findOne({ name: 'USER' });
                if (!defaultRole) {
                    return res.status(500).json({
                        success: false,
                        message: 'Default role not found. Please contact administrator.'
                    });
                }
                userRole = defaultRole._id;
            }

            // Create new user
            const user = new User({
                username,
                email,
                password,
                role: userRole
            });

            await user.save();

            // Generate token
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    },
                    token
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    },

    // User login
    login: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { email, username, password } = req.body;
            const identifier = email || username;

            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email or username and password'
                });
            }

            const lookup = identifier.includes('@')
                ? { email: identifier.toLowerCase() }
                : { username: identifier };

            const user = await User.findOne(lookup).populate('role');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Set session for legacy browser flow
            if (req.session) {
                req.session.authenticated = true;
                req.session.userId = user._id;
                req.session.username = user.username;
            }

            // Generate token
            const token = generateToken(user._id);

            res.json({
                success: true,
                authenticated: true,
                message: 'Login successful',
                username: user.username,
                email: user.email,
                role: user.role.name,
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role.name,
                        permissions: user.role.permissions
                    },
                    token
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user._id)
                .populate('role')
                .select('-password');

            res.json({
                success: true,
                authenticated: true,
                username: user.username,
                email: user.email,
                role: user.role.name,
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive,
                        lastLogin: user.lastLogin,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get profile',
                error: error.message
            });
        }
    },

    // Logout (client-side token removal)
    logout: async (req, res) => {
        if (req.session) {
            req.session.destroy(() => {});
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
};

module.exports = authController;