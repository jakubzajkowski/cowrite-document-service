import { S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  }
  getClient(): S3Client {
    return this.s3;
  }

  getBucketName(): string {
    return this.bucket;
  }
}
