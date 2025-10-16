import { Module } from '@nestjs/common';
import { DocumentsModule } from './documents/documents.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'zaq1@WSX',
      database: process.env.DB_DATABASE || 'cowrite_document_db',
      synchronize: true,
    }),
    DocumentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
