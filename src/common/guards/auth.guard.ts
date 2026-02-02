import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionCookie = request.cookies?.['__session'];

    if (!sessionCookie) {
      throw new UnauthorizedException('No autorizado');
    }

    try {
      const decodedCookie =
        await this.firebaseService.auth.verifySessionCookie(sessionCookie);
      const user = await this.firebaseService.auth.getUser(decodedCookie.uid);

      (request as any).user = {
        uid: decodedCookie.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        isAdmin: decodedCookie.admin === true,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida');
    }
  }
}
