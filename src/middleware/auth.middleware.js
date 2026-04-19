const jwt = require('jsonwebtoken');
const { User } = require('../schemas/user.schema');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'secretKey';

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId)
      .populate({ 
        path: 'role', 
        populate: { path: 'permissions' } 
      });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authMiddleware };
