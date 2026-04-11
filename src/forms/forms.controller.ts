import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
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
  @UseInterceptors(FileInterceptor('pdfFile', {
    storage: diskStorage({
      destination: uploadsDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'form-' + uniqueSuffix + '.pdf');
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true);
      else cb(new Error('Only PDF allowed'), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 }
  }))
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.formsService.createForm(body, file, req.user);
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
