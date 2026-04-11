import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: any) {
    const { email, username, password } = loginDto;
    const identifier = email || username;

    if (!identifier) {
      throw new UnauthorizedException('Please provide email or username');
    }
    
    // Find user either by email or username
    const user: any = await this.userModel.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    }).populate('role');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.jwtService.sign({ userId: user._id.toString() });

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

  async getProfile(user: any) {
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
