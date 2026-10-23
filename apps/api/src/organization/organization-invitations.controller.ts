import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationInvitationsService } from './organization-invitations.service';

/**
 * The invitation link (docs §100). Reading it needs no account - the person
 * may not have one yet - and shows only the organisation, the role, who
 * invited and the masked address. Answering needs the invited address.
 */
@Controller('organization-invitations')
export class OrganizationInvitationsController {
  constructor(private readonly invitations: OrganizationInvitationsService) {}

  @Get(':token')
  async preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async accept(@Request() req: { user: { id: string } }, @Param('token') token: string) {
    return this.invitations.accept(token, req.user.id);
  }

  @Post(':token/decline')
  @UseGuards(JwtAuthGuard)
  async decline(@Request() req: { user: { id: string } }, @Param('token') token: string) {
    return this.invitations.decline(token, req.user.id);
  }
}
