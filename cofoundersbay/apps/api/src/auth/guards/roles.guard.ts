import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<string, number> = {
  founder: 1,
  mentor: 1,
  investor: 1,
  org: 1,
  admin: 10,
  super_admin: 100,
};

function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  return requiredRoles.some((required) => {
    // Exact match always works
    if (userRole === required) return true;
    // Higher-level roles always satisfy lower-level requirements
    const requiredLevel = ROLE_HIERARCHY[required] ?? 0;
    return userLevel > requiredLevel;
  });
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    return hasRequiredRole(user.role, requiredRoles);
  }
}
