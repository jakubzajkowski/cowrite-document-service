import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { S3Service } from '../s3/s3.service';
import { AuthService } from '../auth/auth.service';
import { CreateNoteResponseDto, GetNoteContentResponseDto } from './note.dto';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private noteRepo: Repository<Note>,
    private readonly s3Service: S3Service,
    private readonly authService: AuthService,
  ) {}
  async createNote(
    sessionId: string,
    content: string,
    name: string,
  ): Promise<CreateNoteResponseDto> {
    const user = await this.authService.checkUserAuthorization(sessionId);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const s3Key = `users/${user.id}/notes/${name}.md`;

    const note = this.noteRepo.create({
      name: name,
      s3Key,
      userId: user.id,
      size: Buffer.byteLength(content, 'utf-8'),
      tags: '',
    });

    await this.noteRepo.save(note);

    const existingNote = await this.s3Service.headObject(s3Key);

    if (existingNote) {
      throw new BadRequestException('Note with the same name already exists');
    }

    await this.s3Service.putObject(s3Key, content);

    return {
      message: 'Note created successfully',
      noteId: note.id,
    };
  }
  async getNoteContent(
    sessionId: string,
    noteId: number,
  ): Promise<GetNoteContentResponseDto> {
    const user = await this.authService.checkUserAuthorization(sessionId);
    if (!user) throw new UnauthorizedException('Unauthorized');

    const note = await this.noteRepo.findOneBy({ id: noteId, userId: user.id });
    if (!note) throw new NotFoundException('Not found');

    const content = await this.s3Service.getObjectContent(note.s3Key);
    return { content };
  }

  async getAllNotes(sessionId: string): Promise<Note[]> {
    const user = await this.authService.checkUserAuthorization(sessionId);
    if (!user) throw new UnauthorizedException('Unauthorized');

    return this.noteRepo.findBy({ userId: user.id });
  }
}
