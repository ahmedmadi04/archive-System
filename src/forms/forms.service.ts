import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form } from '../schemas/form.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FormsService {
  constructor(
    @InjectModel(Form.name) private formModel: Model<Form>
  ) {}

  async getAllForms(status: string = 'Active') {
    const forms = await this.formModel.find({ status }).populate('uploadedBy', 'username email').sort({ createdAt: -1 });
    return { success: true, data: { forms } };
  }

  async getFormById(id: string) {
    const form = await this.formModel.findById(id).populate('uploadedBy', 'username email');
    if (!form) throw new NotFoundException('Form not found');
    return { success: true, data: { form } };
  }

  async searchForms(q: string, status: string = 'Active') {
    if (!q) return this.getAllForms(status);
    const searchRegex = new RegExp(q, 'i');
    const forms = await this.formModel.find({
      status,
      $or: [
        { employeeId: searchRegex },
        { employeeName: searchRegex },
        { actionCode: searchRegex },
        { department: searchRegex }
      ]
    }).populate('uploadedBy', 'username email').sort({ createdAt: -1 });
    return { success: true, data: { forms } };
  }

  async updateStatus(id: string, status: string) {
    const form = await this.formModel.findById(id);
    if (!form) throw new NotFoundException('Form not found');
    
    if (!['Active', 'Archived', 'Inactive'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    form.status = status;
    await form.save();
    return { success: true, message: `Form status updated to ${status}`, data: { form } };
  }

  async createForm(createDto: any, file: any, user: any) {
    if (!file) throw new BadRequestException('No file uploaded');

    try {
      let finalActionCode = createDto.actionCode;
      if (!finalActionCode) {
        const count = await this.formModel.countDocuments();
        finalActionCode = `ACT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
      }

      const form = new this.formModel({
        actionCode: finalActionCode,
        employeeId: createDto.employeeId,
        employeeName: createDto.employeeName,
        actionDate: new Date(createDto.actionDate),
        department: createDto.department,
        fileName: file.filename,
        filePath: `/uploads/${file.filename}`,
        uploadedBy: user._id
      });

      await form.save();
      await form.populate('uploadedBy', 'username email');

      return { success: true, message: 'Form created successfully', data: { form } };
    } catch (error: any) {
      if (file) {
        const filePath = path.join(process.cwd(), 'uploads', file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      if (error.code === 11000) {
        throw new BadRequestException('Action code already exists');
      }
      throw error;
    }
  }

  async deleteForm(id: string) {
    const formToDel = await this.formModel.findById(id);
    if (!formToDel) throw new NotFoundException('Form not found');

    const filePath = path.join(process.cwd(), 'uploads', formToDel.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await this.formModel.findByIdAndDelete(id);
    return { success: true, message: 'Form deleted successfully' };
  }
}
