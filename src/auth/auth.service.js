const jwt = require('jsonwebtoken');
const { User } = require('../schemas/user.schema');

class AuthService {
  get jwtSecret() {
    return process.env.JWT_SECRET || 'secretKey';
  }

  async login(loginDto) {
    const { email, username, password } = loginDto;
    const identifier = email || username;

    if (!identifier) {
      throw new Error('Please provide email or username');
    }
    
    // Find user either by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    }).populate('role');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString() }, 
      this.jwtSecret, 
      { expiresIn: '1d' }
    );

    return {
      success: true,
      message: 'Login successful',
      username: user.username,
      email: user.email,
      role: user.role?.name || 'USER',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role?.name || 'USER',
          permissions: user.role?.permissions || []
        },
        token
      }
    };
  }

  async getProfile(user) {
    try {
      const userObj = user.toObject ? user.toObject() : user;
      
      return {
        success: true,
        authenticated: true,
        username: userObj.username,
        email: userObj.email,
        role: userObj.role?.name || 'USER',
        data: {
          user: {
            id: userObj._id,
            username: userObj.username,
            email: userObj.email,
            role: userObj.role,
            isActive: userObj.isActive,
            lastLogin: userObj.lastLogin,
          }
        }
      };
    } catch (error) {
      console.error('AuthService getProfile Error:', error);
      return {
        success: false,
        authenticated: false,
        message: 'Failed to retrieve profile'
      };
    }
  }
}

const authService = new AuthService();
module.exports = { authService };
