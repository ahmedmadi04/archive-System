const mongoose = require('mongoose');

const { Schema } = mongoose;

const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  isSystemRole: { type: Boolean, default: false }
}, { timestamps: true });

const Role = mongoose.model('Role', RoleSchema);

module.exports = { Role };
