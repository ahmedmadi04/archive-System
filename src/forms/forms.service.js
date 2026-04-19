const { Form } = require('../schemas/form.schema');

class FormsService {
  async getAllForms(filter = {}) {
    const forms = await Form.find(filter)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });
    return { success: true, data: { forms } };
  }

  async createForm(formData, file, user) {
    const { actionCode, employeeId, employeeName, actionDate, department } = formData;

    if (!file) {
      throw new Error('PDF file is required');
    }

    // Check if actionCode already exists
    const existingForm = await Form.findOne({ actionCode });
    if (existingForm) {
      throw new Error(`Form with action code ${actionCode} already exists`);
    }

    const form = await Form.create({
      actionCode,
      employeeId,
      employeeName,
      actionDate: new Date(actionDate),
      department,
      fileName: file.filename,
      filePath: `/uploads/${file.filename}`,
      uploadedBy: user._id
    });

    return { success: true, data: form };
  }

  async updateFormStatus(id, status) {
    const form = await Form.findByIdAndUpdate(id, { status }, { new: true });
    if (!form) throw new Error('Form not found');
    return { success: true, data: form };
  }

  async deleteForm(id) {
    const form = await Form.findByIdAndDelete(id);
    if (!form) throw new Error('Form not found');
    return { success: true, message: 'Form deleted successfully' };
  }
}

const formsService = new FormsService();
module.exports = { formsService };
