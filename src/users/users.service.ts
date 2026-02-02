import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import type {
  UserProfile,
  Coupon,
  UserCoupon,
  DecodedUser,
} from '../common/types/index.js';

@Injectable()
export class UsersService {
  private get usersCollection() {
    return this.firebaseService.firestore.collection('users');
  }

  private get userCouponsCollection() {
    return this.firebaseService.firestore.collection('userCoupons');
  }

  private get couponsCollection() {
    return this.firebaseService.firestore.collection('coupons');
  }

  constructor(private firebaseService: FirebaseService) {}

  async getProfile(user: DecodedUser): Promise<UserProfile> {
    const docRef = this.usersCollection.doc(user.uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await docRef.set(newProfile);
      return newProfile;
    }

    return { uid: doc.id, ...doc.data() } as UserProfile;
  }

  async updateProfile(
    user: DecodedUser,
    data: { phone?: string; address?: string; birthDate?: string },
  ): Promise<UserProfile> {
    const docRef = this.usersCollection.doc(user.uid);
    const doc = await docRef.get();

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.phone !== undefined) updateData['phone'] = data.phone;
    if (data.address !== undefined) updateData['address'] = data.address;
    if (data.birthDate !== undefined) updateData['birthDate'] = data.birthDate;

    if (!doc.exists) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      await docRef.set(newProfile);
      return newProfile;
    }

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return { uid: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
  }

  async getUserCoupons(userId: string) {
    const userCouponsSnapshot = await this.userCouponsCollection
      .where('userId', '==', userId)
      .where('usedAt', '==', null)
      .get();

    const couponsWithDetails: (UserCoupon & { couponDetails?: Coupon })[] = [];

    for (const doc of userCouponsSnapshot.docs) {
      const userCoupon = { id: doc.id, ...doc.data() } as UserCoupon;
      const couponDoc = await this.couponsCollection
        .doc(userCoupon.couponId)
        .get();

      if (couponDoc.exists) {
        const coupon = couponDoc.data() as Coupon;
        const now = new Date();
        const validUntil = new Date(coupon.validUntil);

        if (coupon.isActive && now <= validUntil) {
          couponsWithDetails.push({
            ...userCoupon,
            couponDetails: { id: couponDoc.id, ...coupon },
          });
        }
      }
    }

    return couponsWithDetails;
  }

  async assignCoupon(
    user: DecodedUser,
    data: { userId?: string; couponId?: string; code?: string },
  ) {
    // Admin assigning to specific user
    if (user.isAdmin && data.userId && data.couponId) {
      const couponDoc = await this.couponsCollection.doc(data.couponId).get();

      if (!couponDoc.exists) {
        throw new NotFoundException('Cupón no encontrado');
      }

      const coupon = couponDoc.data() as Coupon;

      const existingAssignment = await this.userCouponsCollection
        .where('userId', '==', data.userId)
        .where('couponId', '==', data.couponId)
        .get();

      if (!existingAssignment.empty) {
        throw new BadRequestException('Cupón ya asignado a este usuario');
      }

      const newUserCoupon: Omit<UserCoupon, 'id'> = {
        userId: data.userId,
        couponId: data.couponId,
        couponCode: coupon.code,
        assignedAt: new Date().toISOString(),
      };

      const docRef = await this.userCouponsCollection.add(newUserCoupon);
      return { id: docRef.id, ...newUserCoupon };
    }

    // User adding coupon by code
    if (data.code) {
      const couponSnapshot = await this.couponsCollection
        .where('code', '==', data.code.toUpperCase())
        .limit(1)
        .get();

      if (couponSnapshot.empty) {
        throw new NotFoundException('Cupón no encontrado');
      }

      const couponDoc = couponSnapshot.docs[0];
      const coupon = couponDoc.data() as Coupon;

      if (!coupon.isActive) {
        throw new BadRequestException('Este cupón no está activo');
      }

      const now = new Date();
      const validUntil = new Date(coupon.validUntil);

      if (now > validUntil) {
        throw new BadRequestException('Este cupón ha expirado');
      }

      const existingAssignment = await this.userCouponsCollection
        .where('userId', '==', user.uid)
        .where('couponId', '==', couponDoc.id)
        .get();

      if (!existingAssignment.empty) {
        throw new BadRequestException('Ya tienes este cupón');
      }

      const newUserCoupon: Omit<UserCoupon, 'id'> = {
        userId: user.uid,
        couponId: couponDoc.id,
        couponCode: coupon.code,
        assignedAt: new Date().toISOString(),
      };

      const docRef = await this.userCouponsCollection.add(newUserCoupon);
      return {
        id: docRef.id,
        ...newUserCoupon,
        couponDetails: { id: couponDoc.id, ...coupon },
        message: 'Cupón agregado exitosamente',
      };
    }

    throw new BadRequestException('Datos incompletos');
  }
}
