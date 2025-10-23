import { Test, TestingModule } from '@nestjs/testing';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

describe('NoteController', () => {
  let controller: NoteController;

  const mockNoteService = {
    createNote: jest.fn(),
    getNoteContent: jest.fn(),
    getAllNotes: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
  };

  const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: mockNoteService }],
    }).compile();

    controller = module.get<NoteController>(NoteController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNote', () => {
    it('should call NoteService.createNote and return result', async () => {
      const dto = { name: 'Note1', content: 'Hello' };
      const result = { message: 'Note created', noteId: 1 };
      mockNoteService.createNote.mockResolvedValue(result);

      const response = await controller.createNote(mockUser, dto);

      expect(mockNoteService.createNote).toHaveBeenCalledWith(
        mockUser.id,
        dto.content,
        dto.name,
      );
      expect(response).toBe(result);
    });
  });

  describe('getNoteContent', () => {
    it('should call NoteService.getNoteContent and return content', async () => {
      const noteId = 42;
      const result = { content: 'Hello World' };
      mockNoteService.getNoteContent.mockResolvedValue(result);

      const response = await controller.getNoteContent(mockUser, noteId);

      expect(mockNoteService.getNoteContent).toHaveBeenCalledWith(
        mockUser.id,
        noteId,
      );
      expect(response).toBe(result);
    });
  });

  describe('getAllNotes', () => {
    it('should call NoteService.getAllNotes and return notes', async () => {
      const result = [{ id: 1, name: 'Note1' }];
      mockNoteService.getAllNotes.mockResolvedValue(result);

      const response = await controller.getAllNotes(mockUser);

      expect(mockNoteService.getAllNotes).toHaveBeenCalledWith(mockUser.id);
      expect(response).toBe(result);
    });
  });

  describe('updateNote', () => {
    it('should call NoteService.updateNote', async () => {
      const noteId = 10;
      const content = 'Updated content';
      mockNoteService.updateNote.mockResolvedValue(undefined);

      await controller.updateNote(mockUser, noteId, content);

      expect(mockNoteService.updateNote).toHaveBeenCalledWith(
        mockUser.id,
        noteId,
        content,
      );
    });
  });

  describe('deleteNote', () => {
    it('should call NoteService.deleteNote', async () => {
      const noteId = 5;
      mockNoteService.deleteNote.mockResolvedValue(undefined);

      await controller.deleteNote(mockUser, noteId);

      expect(mockNoteService.deleteNote).toHaveBeenCalledWith(
        mockUser.id,
        noteId,
      );
    });
  });
});
