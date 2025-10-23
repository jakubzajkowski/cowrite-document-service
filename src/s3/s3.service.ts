import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    this.bucket =
      this.configService.get<string>('AWS_S3_BUCKET') || 'my-notes-bucket';

    const endpoint = this.configService.get<string>('AWS_ENDPOINT');

    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'test',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'test',
      },
      ...(endpoint && {
        endpoint,
        forcePathStyle: true,
      }),
    });
  }
  async onModuleInit() {
    this.logger.log('S3Service initialized — checking connection...');
    try {
      const result = await this.s3.config.region();
      this.logger.log(`✅ S3 region: ${result}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Failed to initialize S3: ${error.message}`);
      } else {
        this.logger.error(`❌ Failed to initialize S3: ${String(error)}`);
      }
    }
    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`✅ Bucket "${this.bucket}" is ready`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'BucketAlreadyOwnedByYou') {
        this.logger.log(`✅ Bucket "${this.bucket}" already exists`);
      } else if (err instanceof Error) {
        this.logger.error(`❌ Failed to create bucket: ${err.message}`);
      } else {
        this.logger.error(`❌ Failed to create bucket: ${String(err)}`);
      }
    }
  }
  getClient(): S3Client {
    return this.s3;
  }

  getBucketName(): string {
    return this.bucket;
  }
  async headObject(key: string) {
    try {
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
      const result = await this.s3.send(command);
      this.logger.log(`✅ Object ${key} exists in S3`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Object ${key} does not exist in S3: ${error}`);
    }
  }

  async putObject(
    key: string,
    body: Buffer | string,
    contentType = 'text/markdown',
  ) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      const result = await this.s3.send(command);
      this.logger.log(`✅ Uploaded object ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to upload ${key}: ${error}`);
      throw error;
    }
  }

  async getObject(key: string) {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const result = await this.s3.send(command);
      return result.Body;
    } catch (error) {
      this.logger.error(`❌ Failed to get object ${key}: ${error}`);
      throw error;
    }
  }
  async getObjectContent(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.s3.send(command);

    if (!response.Body) {
      return '';
    }

    if (response.Body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body) {
        chunks.push(Buffer.from(chunk as Uint8Array));
      }
      return Buffer.concat(chunks).toString('utf-8');
    }

    return '';
  }
  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3.send(command);
      this.logger.log(`✅ Deleted object ${key}`);
    } catch (error) {
      this.logger.error(`❌ Failed to delete object ${key}: ${error}`);
      throw error;
    }
  }
}
