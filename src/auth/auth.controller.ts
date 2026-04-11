import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('api')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('auth/login')
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  @Get('auth/check-auth')
  @UseGuards(JwtAuthGuard)
  async checkAuth(@Req() req: any) {
    return this.authService.getProfile(req.user);
  }

  @Get('auth/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user);
  }
}
