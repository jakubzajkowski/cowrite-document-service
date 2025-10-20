import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { UserDto } from './dto/user.dto';
import { AxiosError } from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async isUserAuthorized(sessionId: string): Promise<boolean> {
    const cookie = `COWRITE_SESSION_ID=${sessionId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<UserDto>(
          `${this.configService.get<string>('AUTH_SERVICE_URL')}/me`,
          {
            headers: { Cookie: cookie },
            withCredentials: true,
          },
        ),
      );

      return response.data && response.status === 200;
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error(
        'AuthService request failed:',
        error.response?.data || error.message,
      );
      return false;
    }
  }
}
