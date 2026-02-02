import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @UseGuards(AuthGuard, AdminGuard)
  listUsers(
    @Query('limit') limit?: string,
    @Query('pageToken') pageToken?: string,
  ) {
    return this.adminService.listUsers(
      limit ? parseInt(limit) : 100,
      pageToken,
    );
  }

  @Post('set-admin')
  @UseGuards(AuthGuard, AdminGuard)
  setAdmin(@Body() body: { userId: string; isAdmin: boolean }) {
    return this.adminService.setAdmin(body.userId, body.isAdmin);
  }

  @Post('setup-first-admin')
  setupFirstAdmin(@Body() body: { email: string; secretKey: string }) {
    return this.adminService.setupFirstAdmin(body.email, body.secretKey);
  }

  @Get('stats')
  @UseGuards(AuthGuard, AdminGuard)
  getStats() {
    return this.adminService.getStats();
  }
}
