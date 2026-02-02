import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import type { Coupon, CouponValidation } from '../common/types/index.js';
import type {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto.js';

@Injectable()
export class CouponsService {
  private get couponsCollection() {
    return this.firebaseService.firestore.collection('coupons');
  }

  constructor(private firebaseService: FirebaseService) {}

  async findAll(): Promise<Coupon[]> {
    const snapshot = await this.couponsCollection
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Coupon,
    );
  }

  async findOne(id: string): Promise<Coupon> {
    const doc = await this.couponsCollection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException('Cupón no encontrado');
    }
    return { id: doc.id, ...doc.data() } as Coupon;
  }

  async create(dto: CreateCouponDto, userId: string): Promise<Coupon> {
    if (!dto.code || !dto.type || dto.value === undefined) {
      throw new BadRequestException('Faltan campos requeridos');
    }

    const existing = await this.couponsCollection
      .where('code', '==', dto.code.toUpperCase())
      .get();

    if (!existing.empty) {
      throw new BadRequestException('El código de cupón ya existe');
    }

    const newCoupon: Record<string, any> = {
      code: dto.code.toUpperCase(),
      type: dto.type,
      value: Number(dto.value),
      usedCount: 0,
      validFrom: dto.validFrom || new Date().toISOString().split('T')[0],
      validUntil: dto.validUntil,
      isActive: dto.isActive !== false,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    if (dto.minPurchase) newCoupon['minPurchase'] = Number(dto.minPurchase);
    if (dto.maxUses) newCoupon['maxUses'] = Number(dto.maxUses);
    if (dto.validFromTime) newCoupon['validFromTime'] = dto.validFromTime;
    if (dto.validUntilTime) newCoupon['validUntilTime'] = dto.validUntilTime;
    if (dto.description) newCoupon['description'] = dto.description;

    const docRef = await this.couponsCollection.add(newCoupon);
    return { id: docRef.id, ...newCoupon } as Coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const docRef = this.couponsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cupón no encontrado');
    }

    if (dto.code) {
      const existing = await this.couponsCollection
        .where('code', '==', dto.code.toUpperCase())
        .get();
      const existsOther = existing.docs.some((d) => d.id !== id);
      if (existsOther) {
        throw new BadRequestException('El código de cupón ya existe');
      }
    }

    const updateData: Record<string, any> = {};
    if (dto.code !== undefined) updateData['code'] = dto.code.toUpperCase();
    if (dto.type !== undefined) updateData['type'] = dto.type;
    if (dto.value !== undefined) updateData['value'] = Number(dto.value);
    if (dto.validFrom !== undefined) updateData['validFrom'] = dto.validFrom;
    if (dto.validUntil !== undefined) updateData['validUntil'] = dto.validUntil;
    if (dto.isActive !== undefined) updateData['isActive'] = dto.isActive;
    if (dto.minPurchase !== undefined)
      updateData['minPurchase'] = dto.minPurchase
        ? Number(dto.minPurchase)
        : null;
    if (dto.maxUses !== undefined)
      updateData['maxUses'] = dto.maxUses ? Number(dto.maxUses) : null;
    if (dto.validFromTime !== undefined)
      updateData['validFromTime'] = dto.validFromTime || null;
    if (dto.validUntilTime !== undefined)
      updateData['validUntilTime'] = dto.validUntilTime || null;
    if (dto.description !== undefined)
      updateData['description'] = dto.description || null;

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as Coupon;
  }

  async remove(id: string): Promise<{ message: string }> {
    const docRef = this.couponsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Cupón no encontrado');
    }

    await docRef.delete();
    return { message: 'Cupón eliminado correctamente' };
  }

  async validate(dto: ValidateCouponDto): Promise<CouponValidation> {
    if (!dto.code) {
      return { valid: false, message: 'Código de cupón requerido' };
    }

    const snapshot = await this.couponsCollection
      .where('code', '==', dto.code.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, message: 'Cupón no encontrado' };
    }

    const couponDoc = snapshot.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    if (!coupon.isActive) {
      return { valid: false, message: 'Este cupón no está activo' };
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const validFromDate = coupon.validFrom.split('T')[0];
    const validUntilDate = coupon.validUntil.split('T')[0];

    if (todayStr < validFromDate) {
      return { valid: false, message: 'Este cupón aún no es válido' };
    }

    if (todayStr > validUntilDate) {
      return { valid: false, message: 'Este cupón ha expirado' };
    }

    const hasFromTime = coupon.validFromTime && coupon.validFromTime !== null;
    const hasUntilTime =
      coupon.validUntilTime && coupon.validUntilTime !== null;

    if (hasFromTime || hasUntilTime) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (hasFromTime && currentTime < coupon.validFromTime!) {
        return {
          valid: false,
          message: `Este cupón es válido desde las ${coupon.validFromTime}`,
        };
      }

      if (hasUntilTime && currentTime > coupon.validUntilTime!) {
        return {
          valid: false,
          message: `Este cupón es válido hasta las ${coupon.validUntilTime}`,
        };
      }
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        message: 'Este cupón ha alcanzado el límite de usos',
      };
    }

    if (
      coupon.minPurchase &&
      dto.cartTotal &&
      dto.cartTotal < coupon.minPurchase
    ) {
      return {
        valid: false,
        message: `Compra mínima de $${coupon.minPurchase.toFixed(2)} requerida`,
      };
    }

    let discount = 0;
    if (dto.cartTotal) {
      discount =
        coupon.type === 'percentage'
          ? (dto.cartTotal * coupon.value) / 100
          : Math.min(coupon.value, dto.cartTotal);
    }

    return {
      valid: true,
      coupon,
      message:
        coupon.type === 'percentage'
          ? `${coupon.value}% de descuento aplicado`
          : `$${coupon.value.toFixed(2)} de descuento aplicado`,
      discount,
    };
  }
}
