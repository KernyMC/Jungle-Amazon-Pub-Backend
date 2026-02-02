import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import type { UserProfile } from '../common/types/index.js';

@Injectable()
export class AdminService {
  private get db() {
    return this.firebaseService.firestore;
  }

  private get usersCollection() {
    return this.db.collection('users');
  }

  constructor(private firebaseService: FirebaseService) {}

  async listUsers(limit = 100, pageToken?: string) {
    const listUsersResult = await this.firebaseService.auth.listUsers(
      limit,
      pageToken,
    );

    const userProfiles = new Map<string, UserProfile>();
    const profilesSnapshot = await this.usersCollection.get();
    profilesSnapshot.forEach((doc) => {
      userProfiles.set(doc.id, doc.data() as UserProfile);
    });

    const users = listUsersResult.users.map((user) => {
      const profile = userProfiles.get(user.uid);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
        isAdmin: user.customClaims?.['admin'] === true,
        phone: profile?.phone,
        address: profile?.address,
        birthDate: profile?.birthDate,
      };
    });

    return { users, pageToken: listUsersResult.pageToken };
  }

  async setAdmin(userId: string, isAdmin: boolean) {
    if (!userId) {
      throw new BadRequestException('ID de usuario requerido');
    }

    const newRole = isAdmin ? 'admin' : 'customer';

    await this.firebaseService.auth.setCustomUserClaims(userId, {
      admin: isAdmin,
      role: newRole,
    });

    const userDoc = this.usersCollection.doc(userId);
    const doc = await userDoc.get();

    if (doc.exists) {
      await userDoc.update({
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const userRecord = await this.firebaseService.auth.getUser(userId);
      await userDoc.set({
        uid: userId,
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        role: newRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      message: isAdmin
        ? 'Usuario promovido a administrador'
        : 'Permisos de administrador removidos',
      role: newRole,
    };
  }

  async setupFirstAdmin(email: string, secretKey: string) {
    const SETUP_SECRET = 'jungle-admin-setup-2024';

    if (!email || !secretKey) {
      throw new BadRequestException('Email y secretKey son requeridos');
    }

    if (secretKey !== SETUP_SECRET) {
      throw new ForbiddenException('Secret key inválido');
    }

    let user;
    try {
      user = await this.firebaseService.auth.getUserByEmail(email);
    } catch {
      throw new NotFoundException('Usuario no encontrado con ese email');
    }

    const currentClaims = user.customClaims || {};
    if (currentClaims['admin'] === true) {
      return { message: 'Este usuario ya es administrador' };
    }

    await this.firebaseService.auth.setCustomUserClaims(user.uid, {
      ...currentClaims,
      admin: true,
      role: 'admin',
    });

    return {
      message: `Usuario ${email} ahora es administrador. Cierra sesión y vuelve a entrar para ver los cambios.`,
      uid: user.uid,
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersCollection = this.db.collection('orders');
    const couponsCollection = this.db.collection('coupons');

    const todayOrdersSnapshot = await ordersCollection
      .where('createdAt', '>=', today.toISOString())
      .where('createdAt', '<', tomorrow.toISOString())
      .get();

    let todaySales = 0;
    const todayOrdersCount = todayOrdersSnapshot.size;

    todayOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order['status'] !== 'cancelled') {
        todaySales += order['total'] || 0;
      }
    });

    const allPendingSnapshot = await ordersCollection
      .where('status', '==', 'pending')
      .get();
    const pendingOrdersCount = allPendingSnapshot.size;

    const usersResult = await this.firebaseService.auth.listUsers(1000);
    const totalUsers = usersResult.users.length;

    const activeCouponsSnapshot = await couponsCollection
      .where('isActive', '==', true)
      .get();
    const activeCouponsCount = activeCouponsSnapshot.size;

    const recentOrdersSnapshot = await ordersCollection
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentOrders = recentOrdersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayOrdersSnapshot = await ordersCollection
      .where('createdAt', '>=', yesterday.toISOString())
      .where('createdAt', '<', today.toISOString())
      .get();

    let yesterdaySales = 0;
    yesterdayOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order['status'] !== 'cancelled') {
        yesterdaySales += order['total'] || 0;
      }
    });

    const salesChange =
      yesterdaySales > 0
        ? Math.round(
            ((todaySales - yesterdaySales) / yesterdaySales) * 100,
          )
        : todaySales > 0
          ? 100
          : 0;

    return {
      todaySales,
      todayOrdersCount,
      pendingOrdersCount,
      totalUsers,
      activeCouponsCount,
      salesChange,
      recentOrders,
    };
  }
}
