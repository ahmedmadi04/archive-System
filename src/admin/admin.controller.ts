import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @RequirePermission('users_manage')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  @RequirePermission('users_manage')
  createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }

  @Put('users/:id')
  @RequirePermission('users_manage')
  updateUser(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.adminService.updateUser(id, body, req.user);
  }

  @Patch('users/:id/status')
  @RequirePermission('users_manage')
  toggleUserStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.adminService.updateUser(id, { isActive: body.isActive }, req.user);
  }

  @Get('roles')
  @RequirePermission('roles_manage')
  getRoles() {
    return this.adminService.getAllRoles();
  }

  @Delete('users/:id')
  @RequirePermission('users_manage')
  deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.deleteUser(id, req.user);
  }
}
