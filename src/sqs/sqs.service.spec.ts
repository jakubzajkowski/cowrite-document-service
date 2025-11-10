import { Test, TestingModule } from '@nestjs/testing';
import { SqsService } from './sqs.service';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

jest.mock('@aws-sdk/client-sqs');

describe('SqsService', () => {
  let service: SqsService;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    mockSend = jest.fn();

    (SQSClient as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config: Record<string, string> = {
                AWS_REGION: 'us-east-1',
                AWS_ENDPOINT: 'http://localhost:4566',
                AWS_ACCESS_KEY_ID: 'test',
                AWS_SECRET_ACCESS_KEY: 'test',
                AWS_SQS_WORKSPACE_QUEUE_URL:
                  'http://localhost:4566/000000000000/ai-tasks',
              };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<SqsService>(SqsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send message to SQS', async () => {
    mockSend.mockResolvedValueOnce({});

    const body = { workspaceId: 'abc', fileId: 'file123' };
    await service.sendMessage(body);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));
  });

  it('should receive and delete messages', async () => {
    mockSend
      .mockResolvedValueOnce({
        Messages: [{ Body: '{"workspaceId":"abc"}', ReceiptHandle: 'rh-123' }],
      })
      .mockResolvedValueOnce({});

    await service.pollMessages();

    expect(mockSend).toHaveBeenCalledWith(expect.any(ReceiveMessageCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteMessageCommand));
  });

  it('should handle empty queue gracefully', async () => {
    mockSend.mockResolvedValueOnce({ Messages: [] });
    await service.pollMessages();
    expect(mockSend).toHaveBeenCalledWith(expect.any(ReceiveMessageCommand));
  });
});
