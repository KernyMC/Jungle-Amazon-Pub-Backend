import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { DecodedUser } from '../common/types/index.js';

@Controller('user')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: DecodedUser) {
    return this.usersService.getProfile(user);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: DecodedUser,
    @Body() body: { phone?: string; address?: string; birthDate?: string },
  ) {
    return this.usersService.updateProfile(user, body);
  }

  @Get('coupons')
  getUserCoupons(@CurrentUser('uid') uid: string) {
    return this.usersService.getUserCoupons(uid);
  }

  @Post('coupons')
  @HttpCode(HttpStatus.CREATED)
  assignCoupon(
    @CurrentUser() user: DecodedUser,
    @Body() body: { userId?: string; couponId?: string; code?: string },
  ) {
    return this.usersService.assignCoupon(user, body);
  }
}
