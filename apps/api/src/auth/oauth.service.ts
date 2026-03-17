import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleProfile } from './strategies/google.strategy';
import { LinkedInProfile } from './strategies/linkedin.strategy';

interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleGoogleLogin(profile: GoogleProfile): Promise<OAuthTokens> {
    if (!profile.email) {
      throw new UnauthorizedException('Google account must have an email address');
    }

    // Check if user exists by googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.id },
    });

    if (!user) {
      // Check if user exists by email
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
        });
      } else {
        // Create new user
        const googleSlug = `${profile.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now().toString(36)}`;
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            slug: googleSlug,
            googleId: profile.id,
            emailVerified: true, // Google verifies email
            profile: {
              create: {
                displayName: profile.displayName || profile.firstName || 'User',
                avatarUrl: profile.picture,
              },
            },
          },
        });
      }
    }

    return this.generateTokens(user.id);
  }

  async handleLinkedInLogin(profile: LinkedInProfile): Promise<OAuthTokens> {
    if (!profile.email) {
      throw new UnauthorizedException('LinkedIn account must have an email address');
    }

    // Check if user exists by linkedinId
    let user = await this.prisma.user.findUnique({
      where: { linkedinId: profile.id },
    });

    if (!user) {
      // Check if user exists by email
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link LinkedIn account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { linkedinId: profile.id },
        });
      } else {
        // Create new user
        const linkedinSlug = `${profile.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now().toString(36)}`;
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            slug: linkedinSlug,
            linkedinId: profile.id,
            emailVerified: true, // LinkedIn verifies email
            profile: {
              create: {
                displayName: profile.displayName || `${profile.firstName} ${profile.lastName}`.trim() || 'User',
                avatarUrl: profile.picture,
              },
            },
          },
        });
      }
    }

    return this.generateTokens(user.id);
  }

  async linkGoogleAccount(userId: string, profile: GoogleProfile): Promise<void> {
    // Check if this Google account is already linked to another user
    const existingUser = await this.prisma.user.findUnique({
      where: { googleId: profile.id },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This Google account is already linked to another user');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { googleId: profile.id },
    });
  }

  async linkLinkedInAccount(userId: string, profile: LinkedInProfile): Promise<void> {
    // Check if this LinkedIn account is already linked to another user
    const existingUser = await this.prisma.user.findUnique({
      where: { linkedinId: profile.id },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This LinkedIn account is already linked to another user');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { linkedinId: profile.id },
    });
  }

  async unlinkGoogleAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Ensure user has another login method
    if (!user.passwordHash && !user.linkedinId) {
      throw new ConflictException('Cannot unlink the only login method. Please set a password first.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { googleId: null },
    });
  }

  async unlinkLinkedInAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Ensure user has another login method
    if (!user.passwordHash && !user.googleId) {
      throw new ConflictException('Cannot unlink the only login method. Please set a password first.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { linkedinId: null },
    });
  }

  async getLinkedAccounts(userId: string): Promise<{ google: boolean; linkedin: boolean; hasPassword: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleId: true, linkedinId: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      google: !!user.googleId,
      linkedin: !!user.linkedinId,
      hasPassword: !!user.passwordHash,
    };
  }

  private async generateTokens(userId: string): Promise<OAuthTokens> {
    const payload = { sub: userId };
    
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY') || '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET') || this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY') || '7d',
    });

    // Store refresh token hash
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }
}
