export class CreateCouponDto {
  code!: string;
  type!: 'percentage' | 'fixed';
  value!: number;
  minPurchase?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil!: string;
  validFromTime?: string;
  validUntilTime?: string;
  isActive?: boolean;
  description?: string;
}

export class UpdateCouponDto {
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minPurchase?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  validFromTime?: string;
  validUntilTime?: string;
  isActive?: boolean;
  description?: string;
}

export class ValidateCouponDto {
  code!: string;
  cartTotal?: number;
}
