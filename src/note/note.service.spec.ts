import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoteService } from './note.service';
import { Note } from './note.entity';
import { S3Service } from '../s3/s3.service';
import { AuthService } from '../auth/auth.service';

describe('NoteService', () => {
  let service: NoteService;
  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockS3Service = {
    headObject: jest.fn(),
    putObject: jest.fn(),
    getObjectContent: jest.fn(),
  };

  const mockAuthService = {
    checkUserAuthorization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: getRepositoryToken(Note), useValue: mockRepository },
        { provide: S3Service, useValue: mockS3Service },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
