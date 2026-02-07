import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemSelectionDto {
  @IsString()
  label!: string;

  @IsNumber()
  @Min(0)
  extraPrice!: number;
}

class OrderItemOptionDto {
  @IsString()
  groupTitle!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemSelectionDto)
  selections!: OrderItemSelectionDto[];
}

class OrderItemDto {
  @IsString()
  menuItemId!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemOptionDto)
  options?: OrderItemOptionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  userPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  couponCode?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
