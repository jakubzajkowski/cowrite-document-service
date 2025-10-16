import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  LocalstackContainer,
  StartedLocalStackContainer,
} from '@testcontainers/localstack';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './../src/documents/documents.module';
import { S3Module } from './../src/s3/s3.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let postgresContainer: StartedPostgreSqlContainer;
  let localstackContainer: StartedLocalStackContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer('postgres:16')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    localstackContainer = await new LocalstackContainer('localstack/localstack:3.0')
      .start();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              AWS_REGION: 'us-east-1',
              AWS_ACCESS_KEY_ID: 'test',
              AWS_SECRET_ACCESS_KEY: 'test',
              AWS_S3_BUCKET: 'test-bucket',
              AWS_ENDPOINT: localstackContainer.getConnectionUri(),
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: postgresContainer.getHost(),
          port: postgresContainer.getMappedPort(5432),
          username: postgresContainer.getUsername(),
          password: postgresContainer.getPassword(),
          database: postgresContainer.getDatabase(),
          autoLoadEntities: true,
          synchronize: true,
        }),
        DocumentsModule,
        S3Module,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (postgresContainer) {
      await postgresContainer.stop();
    }
    if (localstackContainer) {
      await localstackContainer.stop();
    }
  });

  it('should start with DB and S3', () => {
    expect(postgresContainer).toBeDefined();
    expect(localstackContainer).toBeDefined();
    expect(app).toBeDefined();
  });

  it('should be able to query documents endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/documents');
    expect(response.status).toBe(200);
  });
});
