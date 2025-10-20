import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { NoteService } from './note.service';
import type { Request } from 'express';

interface CreateNoteDto {
  content: string;
  name: string;
}

@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNote(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const sessionId = req.cookies['COWRITE_SESSION_ID'] as string;
    const note = await this.noteService.createNote(
      sessionId,
      dto.content,
      dto.name,
    );
    return note;
  }
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getNoteContent(@Req() req: Request, @Param('id') noteId: number) {
    const sessionId = req.cookies['COWRITE_SESSION_ID'] as string;
    return this.noteService.getNoteContent(sessionId, noteId);
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllNotes(@Req() req: Request) {
    const sessionId = req.cookies['COWRITE_SESSION_ID'] as string;
    return this.noteService.getAllNotes(sessionId);
  }
}
