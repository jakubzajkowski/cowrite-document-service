export interface CreateNoteResponseDto {
  message: string;
  noteId: number;
}

export interface GetNoteContentResponseDto {
  content: string;
}

export interface SqsMessageDto {
  workspaceId: number;
  fileId: number;
  s3Key: string;
}
