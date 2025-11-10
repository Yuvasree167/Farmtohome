const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  addresses: [
    {
      label: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
      isDefault: { type: Boolean, default: false }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
