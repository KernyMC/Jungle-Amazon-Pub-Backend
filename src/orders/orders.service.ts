import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import type {
  Order,
  OrderStatus,
  Coupon,
  DecodedUser,
} from '../common/types/index.js';
import type { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto.js';

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  private get ordersCollection() {
    return this.firebaseService.firestore.collection('orders');
  }

  private get couponsCollection() {
    return this.firebaseService.firestore.collection('coupons');
  }

  constructor(private firebaseService: FirebaseService) {}

  async findAll(
    user: DecodedUser,
    status?: string,
    limit = 50,
  ): Promise<Order[]> {
    let query: FirebaseFirestore.Query;

    if (user.isAdmin) {
      if (status) {
        query = this.ordersCollection
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .limit(limit);
      } else {
        query = this.ordersCollection
          .orderBy('createdAt', 'desc')
          .limit(limit);
      }
    } else {
      query = this.ordersCollection
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Order,
    );
  }

  async findOne(id: string, user: DecodedUser): Promise<Order> {
    const doc = await this.ordersCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const order = doc.data() as Order;

    if (!user.isAdmin && order.userId !== user.uid) {
      throw new ForbiddenException('No autorizado');
    }

    return { id: doc.id, ...order };
  }

  async create(dto: CreateOrderDto, user: DecodedUser): Promise<Order> {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException(
        'El pedido debe tener al menos un producto',
      );
    }

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const optionsExtra =
        (item.options?.reduce(
          (acc, group) =>
            acc +
            group.selections.reduce((s, sel) => s + (sel.extraPrice || 0), 0),
          0,
        ) || 0) * item.quantity;
      const itemSubtotal = item.basePrice * item.quantity + optionsExtra;
      subtotal += itemSubtotal;
      return { ...item, subtotal: itemSubtotal };
    });

    let discount = 0;
    let couponCode = dto.couponCode;

    if (couponCode) {
      const couponSnapshot = await this.couponsCollection
        .where('code', '==', couponCode.toUpperCase())
        .limit(1)
        .get();

      if (!couponSnapshot.empty) {
        const couponDoc = couponSnapshot.docs[0];
        const coupon = couponDoc.data() as Coupon;
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (
          coupon.isActive &&
          now >= validFrom &&
          now <= validUntil &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
          (!coupon.minPurchase || subtotal >= coupon.minPurchase)
        ) {
          discount =
            coupon.type === 'percentage'
              ? (subtotal * coupon.value) / 100
              : Math.min(coupon.value, subtotal);

          await couponDoc.ref.update({ usedCount: coupon.usedCount + 1 });
        } else {
          couponCode = undefined;
        }
      } else {
        couponCode = undefined;
      }
    }

    const total = subtotal - discount;

    const newOrder: Omit<Order, 'id'> = {
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || '',
      userPhone: dto.userPhone,
      items: orderItems,
      subtotal,
      discount,
      couponCode,
      total,
      status: 'pending',
      deliveryAddress: dto.deliveryAddress,
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await this.ordersCollection.add(newOrder);
    return { id: docRef.id, ...newOrder };
  }

  async update(
    id: string,
    dto: UpdateOrderDto,
    user: DecodedUser,
  ): Promise<Order> {
    const docRef = this.ordersCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const order = doc.data() as Order;

    if (!user.isAdmin) {
      if (order.userId !== user.uid) {
        throw new ForbiddenException('No autorizado');
      }
      if (dto.status !== 'cancelled' || order.status !== 'pending') {
        throw new ForbiddenException('Solo puedes cancelar pedidos pendientes');
      }
    }

    if (dto.status) {
      const currentStatus = order.status;
      const newStatus = dto.status as OrderStatus;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new BadRequestException(
          `No se puede cambiar de "${currentStatus}" a "${newStatus}"`,
        );
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (dto.status) {
      updateData['status'] = dto.status;
      if (dto.status === 'confirmed') {
        updateData['confirmedAt'] = new Date().toISOString();
      } else if (dto.status === 'delivered') {
        updateData['completedAt'] = new Date().toISOString();
      }
    }

    if (user.isAdmin && dto.notes !== undefined) {
      updateData['notes'] = dto.notes;
    }

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as Order;
  }

  async remove(id: string): Promise<{ message: string }> {
    const docRef = this.ordersCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Pedido no encontrado');
    }

    await docRef.delete();
    return { message: 'Pedido eliminado correctamente' };
  }
}
