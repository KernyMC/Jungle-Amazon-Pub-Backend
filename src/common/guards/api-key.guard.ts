import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const apiKey = this.configService.get<string>('API_KEY');

    // Si no hay API_KEY configurada, no bloquear (útil en desarrollo sin .env)
    if (!apiKey) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const incoming = request.headers['x-api-key'];

    if (incoming !== apiKey) {
      throw new UnauthorizedException('API key inválida');
    }

    return true;
  }
}
