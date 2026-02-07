import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message: 'El código solo puede contener letras, números, guiones y guiones bajos',
  })
  code!: string;

  @IsEnum(['percentage', 'fixed'])
  type!: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsString()
  validUntil!: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido (HH:MM)',
  })
  validFromTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido (HH:MM)',
  })
  validUntilTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message: 'El código solo puede contener letras, números, guiones y guiones bajos',
  })
  code?: string;

  @IsOptional()
  @IsEnum(['percentage', 'fixed'])
  type?: 'percentage' | 'fixed';

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido (HH:MM)',
  })
  validFromTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido (HH:MM)',
  })
  validUntilTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cartTotal?: number;
}
