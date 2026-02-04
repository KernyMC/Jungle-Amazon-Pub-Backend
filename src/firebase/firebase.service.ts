import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app!: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      // Try to load from environment variable first
      const serviceAccountEnv = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT',
      );

      let serviceAccount: any;

      if (serviceAccountEnv) {
        // Load from environment variable (production)
        try {
          serviceAccount = JSON.parse(serviceAccountEnv);
        } catch (error) {
          throw new Error(
            'Invalid FIREBASE_SERVICE_ACCOUNT JSON: ' + error.message,
          );
        }
      } else {
        // Try to load from file (development fallback)
        try {
          serviceAccount = require('../../jungle--pub-firebase-adminsdk-fbsvc-930299d838.json');
        } catch (error) {
          throw new Error(
            'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT environment variable or add credentials file.',
          );
        }
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
    } else {
      this.app = admin.apps[0]!;
    }
  }

  get auth(): admin.auth.Auth {
    return admin.auth(this.app);
  }

  get firestore(): admin.firestore.Firestore {
    return admin.firestore(this.app);
  }
}
