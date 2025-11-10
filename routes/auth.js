const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_please_change';

// Simple auth middleware for routes below
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

// Signup
router.post('/signup', async (req, res) => {
  try{
    const { name, email, password } = req.body;
    if(!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if(exists) return res.status(400).json({ message: 'Email already in use' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, passwordHash, addresses: [] });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, addresses: user.addresses } });
  }catch(err){
    console.error(err);res.status(500).json({ message: 'Server error' });
  }
});

// Signin
router.post('/signin', async (req, res) => {
  try{
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, addresses: user.addresses } });
  }catch(err){
    console.error(err);res.status(500).json({ message: 'Server error' });
  }
});

// Get current user (profile + addresses)
router.get('/me', authMiddleware, async (req, res) => {
  try{
    const user = await User.findById(req.user.id).select('-passwordHash');
    if(!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Update profile
router.put('/me', authMiddleware, async (req, res) => {
  try{
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: 'Not found' });
    if(name) user.name = name;
    if(phone) user.phone = phone;
    await user.save();
    res.json({ message: 'Updated', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, addresses: user.addresses } });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Addresses: add
router.post('/addresses', authMiddleware, async (req, res) => {
  try{
    const { label, address, city, state, pincode, phone, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: 'Not found' });
    if(isDefault) user.addresses.forEach(a=>a.isDefault=false);
    user.addresses.push({ label, address, city, state, pincode, phone, isDefault: !!isDefault });
    await user.save();
    res.json({ message: 'Address added', addresses: user.addresses });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Addresses: update
router.put('/addresses/:idx', authMiddleware, async (req, res) => {
  try{
    const idx = parseInt(req.params.idx,10);
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: 'Not found' });
    const addr = user.addresses[idx];
    if(!addr) return res.status(404).json({ message: 'Address not found' });
    const { label, address, city, state, pincode, phone, isDefault } = req.body;
    if(isDefault) user.addresses.forEach(a=>a.isDefault=false);
    if(label !== undefined) addr.label = label;
    if(address !== undefined) addr.address = address;
    if(city !== undefined) addr.city = city;
    if(state !== undefined) addr.state = state;
    if(pincode !== undefined) addr.pincode = pincode;
    if(phone !== undefined) addr.phone = phone;
    if(isDefault !== undefined) addr.isDefault = !!isDefault;
    await user.save();
    res.json({ message: 'Address updated', addresses: user.addresses });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Addresses: delete
router.delete('/addresses/:idx', authMiddleware, async (req, res) => {
  try{
    const idx = parseInt(req.params.idx,10);
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: 'Not found' });
    if(idx < 0 || idx >= user.addresses.length) return res.status(404).json({ message: 'Address not found' });
    user.addresses.splice(idx,1);
    await user.save();
    res.json({ message: 'Address removed', addresses: user.addresses });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
