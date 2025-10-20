import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

describe('S3Service', () => {
  let service: S3Service;
  const s3Mock = mockClient(S3Client);

  beforeEach(async () => {
    s3Mock.reset();
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string): string | undefined => {
              const config: Record<string, string> = {
                AWS_S3_BUCKET: 'test-bucket',
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return S3 client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
  });

  it('should return bucket name', () => {
    const bucketName = service.getBucketName();
    expect(bucketName).toBe('test-bucket');
  });

  it('should call S3 ListBucketsCommand', async () => {
    const client = service.getClient();
    await client.send(new ListBucketsCommand({}));
    expect(s3Mock.calls()).toHaveLength(1);
  });
});
