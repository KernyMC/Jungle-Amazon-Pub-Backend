import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { FirebaseModule } from './firebase/firebase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { AdminModule } from './admin/admin.module.js';
import { UsersModule } from './users/users.module.js';
import { ApiKeyGuard } from './common/guards/api-key.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // ventana de 1 minuto
        limit: 60,     // máx 60 requests por IP por minuto (uso normal)
      },
      {
        name: 'strict',
        ttl: 60_000,
        limit: 10,     // máx 10 requests por IP por minuto (endpoints sensibles)
      },
    ]),
    FirebaseModule,
    AuthModule,
    OrdersModule,
    CouponsModule,
    AdminModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
