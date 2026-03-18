import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SSOMode, SSOProviderType } from '@prisma/client';

export interface SSODiscoveryResult {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  ssoMode: SSOMode;
  providerId?: string;
  providerName?: string;
  providerType?: SSOProviderType;
  loginButtonText?: string;
  loginButtonColor?: string;
  logoUrl?: string;
  allowPasswordFallback: boolean;
}

export interface SSOCallbackPayload {
  providerId: string;
  externalId: string;
  email: string;
  displayName?: string;
  rawClaims?: Record<string, unknown>;
}

export interface SSOLoginResult {
  userId: string;
  email: string;
  isNewUser: boolean;
  isNewMembership: boolean;
  tenantId: string;
  redirectUrl?: string;
}

@Injectable()
export class SSOService {
  private readonly logger = new Logger(SSOService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Discover SSO configuration for a given email domain
   */
  async discoverByEmail(email: string): Promise<SSODiscoveryResult | null> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    // Find domain mapping
    const domainMapping = await this.prisma.domainMapping.findUnique({
      where: { domain },
      include: {
        tenant: {
          include: {
            ssoConfig: {
              include: { identityProvider: true },
            },
          },
        },
      },
    });

    if (!domainMapping?.tenant?.ssoConfig) return null;

    const { tenant } = domainMapping;
    const ssoConfig = tenant.ssoConfig!;
    const provider = ssoConfig.identityProvider;

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.displayName || tenant.name,
      ssoMode: ssoConfig.ssoMode,
      providerId: provider?.id,
      providerName: provider?.providerName,
      providerType: provider?.providerType,
      loginButtonText: provider?.loginButtonText || 'Continue with SSO',
      loginButtonColor: provider?.loginButtonColor ?? undefined,
      logoUrl: provider?.logoUrl ?? undefined,
      allowPasswordFallback: ssoConfig.allowPasswordFallback,
    };
  }

  /**
   * Discover SSO configuration for a tenant by slug
   */
  async discoverByTenantSlug(slug: string): Promise<SSODiscoveryResult | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        ssoConfig: {
          include: { identityProvider: true },
        },
      },
    });

    if (!tenant?.ssoConfig) return null;

    const ssoConfig = tenant.ssoConfig!;
    const provider = ssoConfig.identityProvider;

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.displayName || tenant.name,
      ssoMode: ssoConfig.ssoMode,
      providerId: provider?.id,
      providerName: provider?.providerName,
      providerType: provider?.providerType,
      loginButtonText: provider?.loginButtonText || 'Continue with SSO',
      loginButtonColor: provider?.loginButtonColor ?? undefined,
      logoUrl: provider?.logoUrl ?? undefined,
      allowPasswordFallback: ssoConfig.allowPasswordFallback,
    };
  }

  /**
   * Get identity provider configuration for SSO initiation
   */
  async getProviderConfig(providerId: string) {
    const provider = await this.prisma.identityProvider.findUnique({
      where: { id: providerId },
      include: {
        tenant: true,
        ssoConfig: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Identity provider not found');
    }

    if (!provider.isActive) {
      throw new BadRequestException('Identity provider is not active');
    }

    return provider;
  }

  /**
   * Handle SSO callback - find or create user, link identity, assign membership
   */
  async handleSSOCallback(payload: SSOCallbackPayload): Promise<SSOLoginResult> {
    const { providerId, externalId, email, displayName, rawClaims } = payload;

    // Get provider and config
    const provider = await this.prisma.identityProvider.findUnique({
      where: { id: providerId },
      include: {
        tenant: true,
        ssoConfig: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Identity provider not found');
    }

    const tenantId = provider.tenantId;
    const ssoConfig = provider.ssoConfig;

    // Validate email domain if enforced
    if (ssoConfig?.enforceEmailDomain && ssoConfig.allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const isAllowed = ssoConfig.allowedDomains.some(
        (d) => d.toLowerCase() === emailDomain,
      );
      if (!isAllowed) {
        await this.logAuthEvent(providerId, null, 'login_failure', email, externalId, {
          errorCode: 'DOMAIN_NOT_ALLOWED',
          errorMessage: `Email domain ${emailDomain} is not allowed`,
        });
        throw new UnauthorizedException('Email domain is not allowed for this organization');
      }
    }

    // Check if identity already exists
    const existingIdentity = await this.prisma.userIdentity.findUnique({
      where: {
        identityProviderId_externalId: {
          identityProviderId: providerId,
          externalId,
        },
      },
      include: { user: true },
    });

    let user = existingIdentity?.user ?? null;
    let userIdentityId = existingIdentity?.id;
    let isNewUser = false;
    let isNewMembership = false;

    if (!user) {
      // Try to find existing user by email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        user = existingUser;
        // Link existing user to this identity
        const newIdentity = await this.prisma.userIdentity.create({
          data: {
            userId: user.id,
            identityProviderId: providerId,
            externalId,
            email,
            displayName,
            rawClaims: rawClaims as any,
          },
        });
        userIdentityId = newIdentity.id;

        await this.logAuthEvent(providerId, user.id, 'link', email, externalId);
      } else if (ssoConfig?.autoProvisionEnabled) {
        // JIT provisioning - create new user
        const userSlug = await this.generateUniqueSlug(displayName || email.split('@')[0]);
        
        const newUser = await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            slug: userSlug,
            role: (ssoConfig.defaultRole as any) || 'founder',
            emailVerified: true, // SSO users are pre-verified
            profile: {
              create: {
                displayName: displayName || email.split('@')[0],
              },
            },
          },
        });
        user = newUser;

        const newIdentity = await this.prisma.userIdentity.create({
          data: {
            userId: user.id,
            identityProviderId: providerId,
            externalId,
            email,
            displayName,
            rawClaims: rawClaims as any,
          },
        });
        userIdentityId = newIdentity.id;

        isNewUser = true;
        await this.logAuthEvent(providerId, user.id, 'provision', email, externalId);
      } else {
        await this.logAuthEvent(providerId, null, 'login_failure', email, externalId, {
          errorCode: 'USER_NOT_FOUND',
          errorMessage: 'No account found and auto-provisioning is disabled',
        });
        throw new UnauthorizedException(
          'No account found. Please contact your organization administrator.',
        );
      }
    }

    // Update last login
    if (userIdentityId) {
      await this.prisma.userIdentity.update({
        where: { id: userIdentityId },
        data: { lastLoginAt: new Date() },
      });
    }

    // Ensure tenant membership
    if (ssoConfig?.autoAssignToTenant) {
      const existingMembership = await this.prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: user.id,
          },
        },
      });

      if (!existingMembership) {
        // Apply role mapping rules
        let role = 'member';
        if (ssoConfig.roleMappingRules && rawClaims) {
          role = this.applyRoleMappingRules(ssoConfig.roleMappingRules as any[], rawClaims);
        }

        await this.prisma.tenantMembership.create({
          data: {
            tenantId,
            userId: user.id,
            role,
            provisionedViaSSO: true,
            lastSSOLoginAt: new Date(),
          },
        });
        isNewMembership = true;
      } else {
        await this.prisma.tenantMembership.update({
          where: { id: existingMembership.id },
          data: { lastSSOLoginAt: new Date() },
        });
      }
    }

    await this.logAuthEvent(providerId, user.id, 'login_success', email, externalId);

    return {
      userId: user.id,
      email: user.email,
      isNewUser,
      isNewMembership,
      tenantId,
      redirectUrl: isNewUser && ssoConfig?.requireProfileCompletion
        ? '/onboarding'
        : ssoConfig?.postLoginRedirect || '/dashboard',
    };
  }

  /**
   * Apply role mapping rules from SSO claims
   */
  private applyRoleMappingRules(
    rules: Array<{ claim: string; value: string; role: string }>,
    claims: Record<string, unknown>,
  ): string {
    for (const rule of rules) {
      const claimValue = claims[rule.claim];
      if (Array.isArray(claimValue) && claimValue.includes(rule.value)) {
        return rule.role;
      }
      if (claimValue === rule.value) {
        return rule.role;
      }
    }
    return 'member';
  }

  /**
   * Generate unique user slug
   */
  private async generateUniqueSlug(baseName: string): Promise<string> {
    const base = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    let slug = base;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Log SSO authentication event
   */
  private async logAuthEvent(
    identityProviderId: string,
    userId: string | null,
    eventType: string,
    email?: string,
    externalId?: string,
    error?: { errorCode?: string; errorMessage?: string },
  ) {
    try {
      await this.prisma.sSOAuthEvent.create({
        data: {
          identityProviderId,
          userId,
          eventType,
          email,
          externalId,
          errorCode: error?.errorCode,
          errorMessage: error?.errorMessage,
        },
      });
    } catch (e) {
      this.logger.error('Failed to log SSO auth event', e);
    }
  }

  /**
   * Get user's tenant memberships
   */
  async getUserTenantMemberships(userId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { userId, isActive: true },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            displayName: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  /**
   * Check if user can use password login for a tenant
   */
  async canUsePasswordLogin(email: string): Promise<boolean> {
    const discovery = await this.discoverByEmail(email);
    
    if (!discovery) return true; // No SSO config, allow password
    if (discovery.ssoMode === 'disabled') return true;
    if (discovery.ssoMode === 'optional') return true;
    if (discovery.ssoMode === 'required' && discovery.allowPasswordFallback) return true;
    
    return false;
  }
}
