import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsMessageDto } from 'src/note/note.dto';

@Injectable()
export class SqsService {
  private readonly sqs: SQSClient;
  private readonly logger = new Logger(SqsService.name);
  private readonly queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqs = new SQSClient({
      region: configService.get<string>('AWS_REGION') || 'us-east-1',
      endpoint:
        configService.get<string>('AWS_ENDPOINT') || 'http://localhost:4566',
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID') || 'test',
        secretAccessKey:
          configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'test',
      },
    });
    this.queueUrl =
      this.configService.get<string>('AWS_SQS_WORKSPACE_QUEUE_URL') || '';
  }

  async sendMessage(body: SqsMessageDto) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(body),
    });

    await this.sqs.send(command);
    this.logger.log('✅ Message sent to SQS:', body);
  }

  async pollMessages() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 5,
    });

    const response = await this.sqs.send(command);

    if (response.Messages && response.Messages.length > 0) {
      for (const message of response.Messages) {
        this.logger.log('✅ Message received:', message.Body);

        await this.sqs.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle!,
          }),
        );
      }
    }
  }
}
