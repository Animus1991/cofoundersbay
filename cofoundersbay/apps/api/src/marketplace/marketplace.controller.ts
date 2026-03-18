import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketplaceService, CreateMarketplaceServiceDto, UpdateMarketplaceServiceDto } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.marketplaceService.findAll({
      category: category as any,
      search,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.marketplaceService.getCategories();
    return { categories };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateMarketplaceServiceDto) {
    const service = await this.marketplaceService.create(req.user.userId, dto);
    return { service };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateMarketplaceServiceDto,
  ) {
    const isAdmin = req.user.role === 'admin';
    const service = await this.marketplaceService.update(id, req.user.userId, dto, isAdmin);
    return { service };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === 'admin';
    return this.marketplaceService.delete(id, req.user.userId, isAdmin);
  }
}
