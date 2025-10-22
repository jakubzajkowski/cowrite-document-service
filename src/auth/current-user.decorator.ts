import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from './user.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDto => {
    const request = ctx.switchToHttp().getRequest<{ user: UserDto }>();
    return request.user;
  },
);
