import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService, TokenPair } from './auth.service';
import { registerSchema, loginSchema, refreshSchema } from '@cofounderbay/shared';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

interface RegisterDto {
  email: string;
  password: string;
  role?: 'founder' | 'mentor' | 'investor' | 'org';
}

interface LoginDto {
  email: string;
  password: string;
}

interface RefreshDto {
  refreshToken: string;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const input = registerSchema.parse(body);
    return this.authService.register(input);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const input = loginSchema.parse(body);
    return this.authService.login(input);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const { refreshToken } = refreshSchema.parse(body);
    const tokens: TokenPair = await this.authService.refresh(refreshToken);
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: { refreshToken?: string | null }) {
    await this.authService.logout(body.refreshToken ?? null);
    return { ok: true };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: ChangePasswordDto,
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }
    if (body.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }
    await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    return { ok: true };
  }
}
