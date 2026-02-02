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
import { FirebaseService } from '../firebase/firebase.service.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private firebaseService: FirebaseService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.split('Bearer ')[1];

    if (!idToken) {
      throw new UnauthorizedException('No token found');
    }

    try {
      await this.firebaseService.auth.verifyIdToken(idToken, false);
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid token: ' + (error as Error).message,
      );
    }

    const fiveDays = 60 * 60 * 24 * 5 * 1000;
    try {
      const sessionCookie = await this.firebaseService.auth.createSessionCookie(
        idToken,
        { expiresIn: fiveDays },
      );

      res.cookie('__session', sessionCookie, {
        path: '/',
        maxAge: 60 * 60 * 24 * 5 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create session: ' + (error as Error).message,
      );
    }
  }

  @Get('signin')
  async signinGet(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.signin(req, res);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  signout(@Res({ passthrough: true }) res: Response) {
    res.cookie('__session', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { success: true };
  }

  @Get('signout')
  signoutGet(@Res({ passthrough: true }) res: Response) {
    return this.signout(res);
  }

  @Post('register')
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
    } catch (error: any) {
      throw new BadRequestException('Something went wrong: ' + error.message);
    }
  }
}
