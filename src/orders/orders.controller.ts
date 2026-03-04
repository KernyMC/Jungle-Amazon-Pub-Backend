import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { DecodedUser } from '../common/types/index.js';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto.js';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(
    @CurrentUser() user: DecodedUser,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    const safeStatus = status && VALID_STATUSES.includes(status) ? status : undefined;
    const safeLimit = Math.min(Math.max(parseInt(limit ?? '50') || 50, 1), 100);
    return this.ordersService.findAll(user, safeStatus, safeLimit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: DecodedUser) {
    return this.ordersService.findOne(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: DecodedUser) {
    return this.ordersService.create(dto, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: DecodedUser,
  ) {
    return this.ordersService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
