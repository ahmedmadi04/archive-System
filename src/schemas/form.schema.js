const mongoose = require('mongoose');

const { Schema } = mongoose;

const FormSchema = new Schema({
  actionCode: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  actionDate: { type: Date, required: true },
  department: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Form = mongoose.model('Form', FormSchema);

module.exports = { Form };
