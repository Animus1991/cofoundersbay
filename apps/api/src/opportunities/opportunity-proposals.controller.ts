import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OpportunityProposalsService, answerProposalSchema, sendProposalSchema } from './opportunity-proposals.service';

type Me = { id: string };

/** Three segments, so nothing here is read as `GET /opportunities/:id`. */
@Controller('opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunityProposalsController {
  constructor(private readonly proposals: OpportunityProposalsService) {}

  @Get('proposals/incoming')
  incoming(@CurrentUser() user: Me) {
    return this.proposals.incoming(user.id);
  }

  @Get('proposals/sent')
  sent(@CurrentUser() user: Me) {
    return this.proposals.sent(user.id);
  }

  @Post(':id/proposals')
  send(@CurrentUser() user: Me, @Param('id') id: string, @Body() body: unknown) {
    return this.proposals.send(user.id, id, sendProposalSchema.parse(body));
  }

  @Patch('proposals/:proposalId')
  answer(@CurrentUser() user: Me, @Param('proposalId') proposalId: string, @Body() body: unknown) {
    return this.proposals.answer(user.id, proposalId, answerProposalSchema.parse(body).status);
  }
}
