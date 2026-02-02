import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { DecodedUser } from '../types/index.js';

export const CurrentUser = createParamDecorator(
  (data: keyof DecodedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as DecodedUser;
    return data ? user?.[data] : user;
  },
);
