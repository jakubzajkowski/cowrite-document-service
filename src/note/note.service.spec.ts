import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoteService } from './note.service';
import { Note } from './note.entity';
import { S3Service } from '../s3/s3.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SqsService } from '../sqs/sqs.service';

describe('NoteService', () => {
  let service: NoteService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockS3Service = {
    headObject: jest.fn(),
    putObject: jest.fn(),
    getObjectContent: jest.fn(),
    deleteObject: jest.fn(),
  };

  const mockSqsService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: getRepositoryToken(Note), useValue: mockRepository },
        { provide: S3Service, useValue: mockS3Service },
        { provide: SqsService, useValue: mockSqsService },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserStorageUsage', () => {
    it('should return 0 if user has no notes', async () => {
      mockRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: null }),
      }));

      const usage = await service['getUserStorageUsage'](1);
      expect(usage).toBe(0);
    });

    it('should return sum of note sizes', async () => {
      mockRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '1234' }),
      }));

      const usage = await service['getUserStorageUsage'](1);
      expect(usage).toBe(1234);
    });
  });

  describe('createNote', () => {
    it('should throw if storage limit exceeded', async () => {
      jest
        .spyOn(service as any, 'getUserStorageUsage')
        .mockResolvedValue(5 * 1024 * 1024 * 1024);

      await expect(service.createNote(1, 'content', 'note1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if note already exists in S3', async () => {
      jest.spyOn(service as any, 'getUserStorageUsage').mockResolvedValue(0);
      mockS3Service.headObject.mockResolvedValue(true);

      await expect(service.createNote(1, 'content', 'note1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a new note successfully', async () => {
      jest.spyOn(service as any, 'getUserStorageUsage').mockResolvedValue(0);
      mockS3Service.headObject.mockResolvedValue(false);
      mockRepository.create.mockReturnValue({
        id: 1,
        name: 'note1',
        s3Key: 'key',
        userId: 1,
        size: 7,
        tags: '',
      });
      mockRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createNote(1, 'content', 'note1');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockS3Service.putObject).toHaveBeenCalledWith(
        'users/1/notes/note1.md',
        'content',
      );
      expect(result).toEqual({
        message: 'Note created successfully',
        noteId: 1,
      });
    });
  });

  describe('getNoteContent', () => {
    it('should throw if note not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getNoteContent(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return content if note exists', async () => {
      mockRepository.findOneBy.mockResolvedValue({
        id: 1,
        s3Key: 'key',
        userId: 1,
      });
      mockS3Service.getObjectContent.mockResolvedValue('Hello World');

      const result = await service.getNoteContent(1, 1);
      expect(result).toEqual({ content: 'Hello World' });
    });
  });

  describe('deleteNote', () => {
    it('should throw if note not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.deleteNote(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should delete note successfully', async () => {
      const note = { id: 1, s3Key: 'key', userId: 1 };
      mockRepository.findOneBy.mockResolvedValue(note);
      mockRepository.delete.mockResolvedValue({});
      mockS3Service.deleteObject.mockResolvedValue({});

      await service.deleteNote(1, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1, userId: 1 });
      expect(mockS3Service.deleteObject).toHaveBeenCalledWith('key');
    });
  });
});
