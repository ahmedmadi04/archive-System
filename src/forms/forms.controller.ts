import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import * as util from 'util';
import * as stream from 'stream';
const pipeline = util.promisify(stream.pipeline);
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import * as path from 'path';
import * as fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@Controller('api/forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @RequirePermission('forms_read')
  getAll(@Query('status') status: string) {
    return this.formsService.getAllForms(status || 'Active');
  }

  @Get('archived')
  @RequirePermission('forms_read')
  getArchived() {
    return this.formsService.getAllForms('Archived');
  }

  @Get('search')
  @RequirePermission('forms_read')
  search(@Query('q') q: string, @Query('status') status: string) {
    return this.formsService.searchForms(q, status || 'Active');
  }

  @Get(':id')
  @RequirePermission('forms_read')
  getById(@Param('id') id: string) {
    return this.formsService.getFormById(id);
  }

  @Post()
  @RequirePermission('forms_create')
  async create(@Req() req: any) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const body: any = {};
    let fileMock: any = null;

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        if (part.mimetype !== 'application/pdf') {
          throw new BadRequestException('Only PDF allowed');
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'form-' + uniqueSuffix + '.pdf';
        const filePath = path.join(uploadsDir, filename);

        await pipeline(part.file, fs.createWriteStream(filePath));
        fileMock = { filename, path: filePath, mimetype: part.mimetype };
      } else {
        body[part.fieldname] = part.value;
      }
    }

    if (!fileMock) {
      throw new BadRequestException('Missing pdfFile');
    }

    return this.formsService.createForm(body, fileMock, req.user);
  }

  @Delete(':id')
  @RequirePermission('forms_delete')
  delete(@Param('id') id: string) {
    return this.formsService.deleteForm(id);
  }

  @Patch(':id/status')
  @RequirePermission('forms_manage')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.formsService.updateStatus(id, status);
  }
}
