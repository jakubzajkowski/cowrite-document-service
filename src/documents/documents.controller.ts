import { Controller, Get } from '@nestjs/common';

@Controller('documents')
export class DocumentsController {
  @Get()
  getDocuments(): string {
    return 'List of documents';
  }
}
