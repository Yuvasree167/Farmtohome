const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_please_change';

// simple seller auth (same creds as products)
function checkSellerAuth(req){
  const auth = req.headers.authorization || '';
  if(auth.startsWith('Basic ')){
    try{
      const b = Buffer.from(auth.split(' ')[1], 'base64').toString();
      const [user, pass] = b.split(':');
      if(user === 'FTH' && pass === 'FTH12345') return true;
    }catch(e){}
  }
  const sid = req.headers['x-seller-id'];
  const ssecret = req.headers['x-seller-secret'];
  if(sid === 'FTH' && ssecret === 'FTH12345') return true;
  return false;
}

// Get user's orders
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort('-createdAt');
    res.json(orders);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ message: 'Unauthorized' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ message: 'Unauthorized' });
  const token = parts[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; next();
  }catch(err){ return res.status(401).json({ message: 'Invalid token' }); }
}

// Create order
router.post('/', authMiddleware, async (req, res) => {
  try{
    const { items, address } = req.body; // [{product, qty}], optional address object
    if(!items || !items.length) return res.status(400).json({ message: 'No items' });
    // populate price
    const resolved = [];
    let total = 0;
    for(const it of items){
      const p = await Product.findById(it.product);
      if(!p) continue;
      const price = p.price;
      resolved.push({ product: p._id, qty: it.qty, price });
      total += price * (it.qty || 1);
    }
    const orderData = { user: req.user.id, items: resolved, total, status: 'paid' };
    if(address) orderData.address = address;
    const order = new Order(orderData);
    await order.save();
    res.json({ order, message: 'Order created' });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Seller: list all orders
router.get('/', async (req, res) => {
  try{
    // allow if seller headers or basic auth provided
    if(!checkSellerAuth(req)) return res.status(401).json({ message: 'Unauthorized' });
    const orders = await Order.find({}).populate('items.product').sort('-createdAt');
    res.json(orders);
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Seller: update order status
router.put('/:id/status', async (req, res) => {
  try{
    if(!checkSellerAuth(req)) return res.status(401).json({ message: 'Unauthorized' });
    const id = req.params.id;
    const { status } = req.body;
    const allowed = ['pending','paid','accepted','shipped','delivered','cancelled'];
    if(!status || !allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findById(id);
    if(!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ message: 'Order status updated', order });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
