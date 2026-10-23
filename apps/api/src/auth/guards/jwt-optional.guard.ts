import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { extractJwtFromCookieOrHeader } from '../strategies/jwt.strategy';

/** Use on routes that work for both authenticated and anonymous; sets req.user when token is valid. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // Same order as JwtStrategy: the HttpOnly access cookie, then Bearer.
    // Reading only the header left a signed-in viewer anonymous on optional
    // routes (a profile view was stored with no viewer).
    const token = extractJwtFromCookieOrHeader(request);
    if (!token) return true;

    try {
      const payload = this.jwt.verify<{ sub: string; type: string }>(token);
      if (payload?.type !== 'access') return true;
      const user = await this.authService.validateUser(payload.sub);
      if (user) request.user = user;
    } catch {
      // invalid or expired token — proceed without user
    }
    return true;
  }
}
