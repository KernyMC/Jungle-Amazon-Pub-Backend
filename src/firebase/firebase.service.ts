import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import serviceAccountJson from '../../jungle--pub-firebase-adminsdk-fbsvc-c83cceeb2a.json';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app!: admin.app.App;

  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccount = { ...serviceAccountJson };
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
