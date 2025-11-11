import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './note.entity';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module';
import { SqsModule } from 'src/sqs/sqs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), S3Module, AuthModule, SqsModule],
  providers: [NoteService],
  controllers: [NoteController],
})
export class NoteModule {}
