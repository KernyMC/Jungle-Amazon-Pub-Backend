import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CouponsService } from './coupons.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { DecodedUser } from '../common/types/index.js';
import type {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCouponDto, @CurrentUser() user: DecodedUser) {
    return this.couponsService.create(dto, user.uid);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  @Post('validate')
  @UseGuards(AuthGuard)
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(dto);
  }
}
