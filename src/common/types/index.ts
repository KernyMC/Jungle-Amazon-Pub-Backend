export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  validFromTime?: string;
  validUntilTime?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  message: string;
  discount?: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  options?: {
    groupTitle: string;
    selections: {
      label: string;
      extraPrice: number;
    }[];
  }[];
  notes?: string;
  subtotal: number;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
}

export interface UserCoupon {
  id?: string;
  userId: string;
  couponId: string;
  couponCode: string;
  usedAt?: string;
  assignedAt: string;
}

export interface DecodedUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;
}
