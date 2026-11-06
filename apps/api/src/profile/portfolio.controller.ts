import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-optional.guard';
import { PortfolioService, portfolioItemSchema, updatePortfolioItemSchema } from './portfolio.service';

type Me = { id: string };

@Controller()
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('me/portfolio')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: Me) {
    return this.portfolio.mine(user.id);
  }

  @Post('me/portfolio')
  @UseGuards(JwtAuthGuard)
  add(@CurrentUser() user: Me, @Body() body: unknown) {
    return this.portfolio.add(user.id, portfolioItemSchema.parse(body));
  }

  @Patch('me/portfolio/:id')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: Me, @Param('id') id: string, @Body() body: unknown) {
    return this.portfolio.update(user.id, id, updatePortfolioItemSchema.parse(body));
  }

  @Delete('me/portfolio/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: Me, @Param('id') id: string) {
    return this.portfolio.remove(user.id, id);
  }

  @Get('profiles/:userId/portfolio')
  @UseGuards(OptionalJwtAuthGuard)
  ofMember(@Param('userId') userId: string, @CurrentUser() user?: Me) {
    return this.portfolio.ofMember(userId, user?.id);
  }
}
