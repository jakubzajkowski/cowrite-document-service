import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserDto } from './user.dto';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

interface UserPayload {
  id: number;
  username: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET') ?? '';
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }
    const cookieName =
      configService.get<string>('JWT_COOKIE_NAME') ?? 'COWRITE_SESSION_ID';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: (req: Request) => {
        const token = req?.cookies?.[cookieName] as string | undefined;
        if (!token) {
          return null;
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload): UserDto {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userDto: UserPayload = JSON.parse(payload.sub) as UserPayload;

    if (
      !userDto ||
      userDto.id === undefined ||
      !userDto.username ||
      !userDto.email
    ) {
      throw new UnauthorizedException(
        'Invalid token payload - missing required fields',
      );
    }

    const result: UserDto = {
      id: userDto.id,
      username: userDto.username,
      email: userDto.email,
    };

    return result;
  }
}
