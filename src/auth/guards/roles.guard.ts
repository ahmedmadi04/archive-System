import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true; // No specific permission required
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied. No role assigned to user.');
    }

    // Admins always have full access
    if (user.role.name === 'ADMIN' && user.role.isSystemRole) {
      return true; 
    }

    if (!user.role.permissions) {
      throw new ForbiddenException('Access denied. No permissions found for role.');
    }

    const permissions = user.role.permissions.map((p: any) => p.name);
    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`Access denied. Requires ${requiredPermission} permission.`);
    }

    return true;
  }
}
