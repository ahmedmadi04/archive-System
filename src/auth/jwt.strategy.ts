import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      const { userId } = payload;
      const user = await this.userModel.findById(userId)
        .populate({ 
          path: 'role', 
          populate: { path: 'permissions' } 
        })
        .exec();

      if (!user) {
        console.error('JwtStrategy: User not found for ID:', userId);
        throw new UnauthorizedException('Please login to access this resource.');
      }

      if (!user.isActive) {
        console.error('JwtStrategy: User is inactive:', userId);
        throw new UnauthorizedException('Your account has been deactivated.');
      }

      return user;
    } catch (error) {
      console.error('JwtStrategy Error:', error);
      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('Authentication failed');
    }
  }
}
