import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NoteService } from './note.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserDto } from '../auth/user.dto';

interface CreateNoteDto {
  content: string;
  name: string;
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNote(@CurrentUser() user: UserDto, @Body() dto: CreateNoteDto) {
    const note = await this.noteService.createNote(
      user.id,
      dto.content,
      dto.name,
    );
    return note;
  }
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getNoteContent(
    @CurrentUser() user: UserDto,
    @Param('id') noteId: number,
  ) {
    return this.noteService.getNoteContent(user.id, noteId);
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllNotes(@CurrentUser() user: UserDto) {
    return this.noteService.getAllNotes(user.id);
  }
  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateNote(
    @CurrentUser() user: UserDto,
    @Param('id') noteId: number,
    @Body('content') content: string,
  ) {
    await this.noteService.updateNote(user.id, noteId, content);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(@CurrentUser() user: UserDto, @Param('id') noteId: number) {
    await this.noteService.deleteNote(user.id, noteId);
  }
}
