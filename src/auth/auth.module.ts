import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [AuthService],
  imports: [HttpModule],
  exports: [AuthService],
})
export class AuthModule {}
