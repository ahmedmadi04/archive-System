const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        let user = null;
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                user = await User.findById(decoded.userId).populate('role');
            } catch (jwtError) {
                user = null;
            }
        }

        if (!user && req.session && req.session.userId) {
            user = await User.findById(req.session.userId).populate('role');
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

module.exports = auth;