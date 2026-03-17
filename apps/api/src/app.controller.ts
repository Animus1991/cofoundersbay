import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getRoot() {
    const apiPrefix = this.configService.get('app.apiPrefix', 'api');
    return {
      name: 'CoFounderBay API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        api: `/${apiPrefix}`,
        health: `/${apiPrefix}/health`,
        docs: `/${apiPrefix}/docs`,
      },
      message: `API is running. Access endpoints at /${apiPrefix}/*`,
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
