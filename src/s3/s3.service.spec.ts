import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { SdkStream } from '@aws-sdk/types';
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';

describe('S3Service', () => {
  let service: S3Service;
  const s3Mock = mockClient(S3Client);

  beforeEach(async () => {
    s3Mock.reset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
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
    expect(service.getClient()).toBeDefined();
  });

  it('should return bucket name', () => {
    expect(service.getBucketName()).toBe('test-bucket');
  });

  describe('headObject', () => {
    it('should return object metadata if exists', async () => {
      s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 123 });
      const result = await service.headObject('test-key');
      expect(result).toEqual({ ContentLength: 123 });
    });

    it('should return undefined if object does not exist', async () => {
      s3Mock.on(HeadObjectCommand).rejects(new Error('Not Found'));
      const result = await service.headObject('missing-key');
      expect(result).toBeUndefined();
    });
  });

  describe('putObject', () => {
    it('should upload object successfully', async () => {
      s3Mock.on(PutObjectCommand).resolves({ ETag: 'etag123' });
      const result = await service.putObject('test-key', 'content');
      expect(result).toEqual({ ETag: 'etag123' });
    });

    it('should throw on upload error', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('Upload failed'));
      await expect(service.putObject('key', 'content')).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('getObjectContent', () => {
    it('should return string content from Readable stream', async () => {
      const mockStream: SdkStream<Readable> = Readable.from([
        'Hello',
        ' ',
        'World',
      ]) as SdkStream<Readable>;
      s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });

      const content = await service.getObjectContent('test-key');
      expect(content).toBe('Hello World');
    });

    it('should return empty string if Body is undefined', async () => {
      s3Mock.on(GetObjectCommand).resolves({ Body: undefined });
      const content = await service.getObjectContent('test-key');
      expect(content).toBe('');
    });
  });

  describe('deleteObject', () => {
    it('should delete object successfully', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});
      await expect(service.deleteObject('test-key')).resolves.toBeUndefined();
    });

    it('should throw on delete error', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(new Error('Delete failed'));
      await expect(service.deleteObject('key')).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
