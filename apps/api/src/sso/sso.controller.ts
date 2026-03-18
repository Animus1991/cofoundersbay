import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { SSOService } from './sso.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}

  /**
   * Discover SSO configuration by email domain
   * Public endpoint for login flow
   */
  @Get('discover')
  async discoverByEmail(@Query('email') email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    const discovery = await this.ssoService.discoverByEmail(email);
    
    if (!discovery) {
      return {
        ssoAvailable: false,
        allowPasswordLogin: true,
      };
    }

    return {
      ssoAvailable: discovery.ssoMode !== 'disabled',
      ssoRequired: discovery.ssoMode === 'required',
      allowPasswordLogin: discovery.ssoMode !== 'required' || discovery.allowPasswordFallback,
      tenant: {
        id: discovery.tenantId,
        slug: discovery.tenantSlug,
        name: discovery.tenantName,
      },
      provider: discovery.providerId ? {
        id: discovery.providerId,
        name: discovery.providerName,
        type: discovery.providerType,
        loginButtonText: discovery.loginButtonText,
        loginButtonColor: discovery.loginButtonColor,
        logoUrl: discovery.logoUrl,
      } : null,
    };
  }

  /**
   * Discover SSO configuration by tenant slug
   * Public endpoint for tenant-specific login pages
   */
  @Get('discover/tenant/:slug')
  async discoverByTenant(@Param('slug') slug: string) {
    const discovery = await this.ssoService.discoverByTenantSlug(slug);
    
    if (!discovery) {
      return {
        ssoAvailable: false,
        allowPasswordLogin: true,
      };
    }

    return {
      ssoAvailable: discovery.ssoMode !== 'disabled',
      ssoRequired: discovery.ssoMode === 'required',
      allowPasswordLogin: discovery.ssoMode !== 'required' || discovery.allowPasswordFallback,
      tenant: {
        id: discovery.tenantId,
        slug: discovery.tenantSlug,
        name: discovery.tenantName,
      },
      provider: discovery.providerId ? {
        id: discovery.providerId,
        name: discovery.providerName,
        type: discovery.providerType,
        loginButtonText: discovery.loginButtonText,
        loginButtonColor: discovery.loginButtonColor,
        logoUrl: discovery.logoUrl,
      } : null,
    };
  }

  /**
   * Initiate SSO login flow
   * Redirects to identity provider
   */
  @Get('login/:providerId')
  async initiateSSO(
    @Param('providerId') providerId: string,
    @Query('returnUrl') returnUrl: string,
    @Res() res: Response,
  ) {
    const provider = await this.ssoService.getProviderConfig(providerId);

    // Store return URL in session/cookie for callback
    res.cookie('sso_return_url', returnUrl || '/dashboard', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10 minutes
      sameSite: 'lax',
    });

    // Build authorization URL based on provider type
    let authUrl: string;

    if (provider.providerType === 'oidc' || provider.providerType === 'oauth2') {
      const params = new URLSearchParams({
        client_id: provider.oidcClientId!,
        redirect_uri: `${process.env.API_URL}/sso/callback/${providerId}`,
        response_type: 'code',
        scope: provider.oidcScopes || 'openid profile email',
        state: providerId, // Simple state, should be more secure in production
      });

      authUrl = provider.oidcAuthorizationUrl
        ? `${provider.oidcAuthorizationUrl}?${params}`
        : `${provider.oidcIssuerUrl}/authorize?${params}`;
    } else if (provider.providerType === 'saml') {
      // SAML flow would require additional library like passport-saml
      // For now, return error
      throw new BadRequestException('SAML SSO requires additional configuration');
    } else {
      throw new BadRequestException('Unknown provider type');
    }

    return res.redirect(authUrl);
  }

  /**
   * SSO callback handler
   * Processes response from identity provider
   */
  @Get('callback/:providerId')
  async handleCallback(
    @Param('providerId') providerId: string,
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const returnUrl = req.cookies?.sso_return_url || '/dashboard';

    if (error) {
      return res.redirect(
        `/login?error=sso_failed&message=${encodeURIComponent(errorDescription || error)}`,
      );
    }

    if (!code) {
      return res.redirect('/login?error=sso_failed&message=No+authorization+code+received');
    }

    try {
      const provider = await this.ssoService.getProviderConfig(providerId);

      // Exchange code for tokens (simplified - production would use proper OAuth library)
      const tokenResponse = await fetch(
        provider.oidcTokenUrl || `${provider.oidcIssuerUrl}/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${process.env.API_URL}/sso/callback/${providerId}`,
            client_id: provider.oidcClientId!,
            client_secret: provider.oidcClientSecret!,
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch(
        provider.oidcUserInfoUrl || `${provider.oidcIssuerUrl}/userinfo`,
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      );

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await userInfoResponse.json();

      // Process SSO login
      const result = await this.ssoService.handleSSOCallback({
        providerId,
        externalId: userInfo.sub,
        email: userInfo.email,
        displayName: userInfo.name || userInfo.preferred_username,
        rawClaims: userInfo,
      });

      // Clear SSO cookie
      res.clearCookie('sso_return_url');

      // Set auth cookies (this should integrate with your existing auth system)
      // For now, redirect with a token parameter that frontend can use
      const redirectUrl = result.redirectUrl || returnUrl;
      return res.redirect(
        `/auth/sso-complete?userId=${result.userId}&redirect=${encodeURIComponent(redirectUrl)}`,
      );
    } catch (err: any) {
      console.error('SSO callback error:', err);
      return res.redirect(
        `/login?error=sso_failed&message=${encodeURIComponent(err.message || 'SSO login failed')}`,
      );
    }
  }

  /**
   * Check if password login is allowed for an email
   */
  @Get('can-use-password')
  async canUsePassword(@Query('email') email: string) {
    if (!email) {
      return { allowed: true };
    }

    const allowed = await this.ssoService.canUsePasswordLogin(email);
    return { allowed };
  }

  /**
   * Get current user's tenant memberships
   */
  @Get('memberships')
  @UseGuards(JwtAuthGuard)
  async getUserMemberships(@CurrentUser() user: any) {
    const memberships = await this.ssoService.getUserTenantMemberships(user.id);
    return { memberships };
  }
}
