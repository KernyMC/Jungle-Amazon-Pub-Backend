import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FirebaseService } from '../firebase/firebase.service.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private firebaseService: FirebaseService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { ttl: 60_000, limit: 10 } })
  async signin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.split('Bearer ')[1];

    if (!idToken) {
      throw new UnauthorizedException('No token found');
    }

    try {
      await this.firebaseService.auth.verifyIdToken(idToken, false);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    const fiveDays = 60 * 60 * 24 * 5 * 1000;
    try {
      const sessionCookie = await this.firebaseService.auth.createSessionCookie(
        idToken,
        { expiresIn: fiveDays },
      );

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('__session', sessionCookie, {
        path: '/',
        maxAge: 60 * 60 * 24 * 5 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? '.junglaamazonpub.ec' : undefined,
      });

      return { success: true };
    } catch {
      throw new InternalServerErrorException('Error al crear la sesión');
    }
  }

  @Get('signin')
  async signinGet(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.signin(req, res);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  signout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('__session', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? '.junglaamazonpub.ec' : undefined,
    });
    return { success: true };
  }

  @Get('signout')
  signoutGet(@Res({ passthrough: true }) res: Response) {
    return this.signout(res);
  }

  @Post('register')
  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  async register(
    @Body() body: { email?: string; password?: string; name?: string },
  ) {
    const { email, password, name } = body;

    if (!email || !password || !name) {
      throw new BadRequestException('Missing form data');
    }

    try {
      await this.firebaseService.auth.createUser({
        email,
        password,
        displayName: name,
      });
      return { success: true, message: 'Usuario creado exitosamente' };
    } catch {
      throw new BadRequestException('No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.');
    }
  }

  @Post('verify-session')
  @HttpCode(HttpStatus.OK)
  async verifySession(@Body() body: { sessionCookie?: string }) {
    const { sessionCookie } = body;

    if (!sessionCookie) {
      throw new UnauthorizedException('No session cookie provided');
    }

    try {
      const decodedCookie =
        await this.firebaseService.auth.verifySessionCookie(sessionCookie);
      const user = await this.firebaseService.auth.getUser(decodedCookie.uid);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          },
        },
        isAdmin: decodedCookie.admin === true,
      };
    } catch {
      throw new UnauthorizedException('Sesión inválida');
    }
  }
}
