const mongoose = require('mongoose');

const { Schema } = mongoose;

const PermissionSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  resource: { type: String, trim: true },
  action: { type: String, trim: true }
}, { timestamps: true });

const Permission = mongoose.model('Permission', PermissionSchema);

module.exports = { Permission };
