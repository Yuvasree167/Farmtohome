const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    { product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number, price: Number }
  ],
  address: {
    label: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  total: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
