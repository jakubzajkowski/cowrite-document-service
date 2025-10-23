import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { S3Service } from '../s3/s3.service';
import { CreateNoteResponseDto, GetNoteContentResponseDto } from './note.dto';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private noteRepo: Repository<Note>,
    private readonly s3Service: S3Service,
  ) {}
  async createNote(
    userId: number,
    content: string,
    name: string,
  ): Promise<CreateNoteResponseDto> {
    const s3Key = `users/${userId}/notes/${name}.md`;

    const existingNote = await this.s3Service.headObject(s3Key);

    if (existingNote) {
      throw new BadRequestException('Note with the same name already exists');
    }

    const note = this.noteRepo.create({
      name: name,
      s3Key,
      userId: userId,
      size: Buffer.byteLength(content, 'utf-8'),
      tags: '',
    });

    await this.noteRepo.save(note);

    await this.s3Service.putObject(s3Key, content);

    return {
      message: 'Note created successfully',
      noteId: note.id,
    };
  }
  async getNoteContent(
    userId: number,
    noteId: number,
  ): Promise<GetNoteContentResponseDto> {
    const note = await this.noteRepo.findOneBy({ id: noteId, userId: userId });
    if (!note) throw new NotFoundException('Not found');

    const content = await this.s3Service.getObjectContent(note.s3Key);
    return { content };
  }

  async getAllNotes(userId: number): Promise<Note[]> {
    return this.noteRepo.findBy({ userId: userId });
  }
  async updateNote(
    userId: number,
    noteId: number,
    content: string,
  ): Promise<void> {
    const note = await this.noteRepo.findOneBy({ id: noteId, userId: userId });
    if (!note) throw new NotFoundException('Not found');

    this.noteRepo.merge(note, { size: Buffer.byteLength(content, 'utf-8') });
    await this.noteRepo.save(note);

    await this.s3Service.putObject(note.s3Key, content);
  }
  async deleteNote(userId: number, noteId: number): Promise<void> {
    const note = await this.noteRepo.findOneBy({ id: noteId, userId: userId });
    if (!note) throw new NotFoundException('Not found');

    await this.noteRepo.delete({ id: noteId, userId: userId });
    await this.s3Service.deleteObject(note.s3Key);
  }
}
