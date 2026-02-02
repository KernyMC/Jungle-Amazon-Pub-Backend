import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { AdminModule } from './admin/admin.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    AuthModule,
    OrdersModule,
    CouponsModule,
    AdminModule,
    UsersModule,
  ],
})
export class AppModule {}
