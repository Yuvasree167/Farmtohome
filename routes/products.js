const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads folder exists under public
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// multer storage to public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// GET /api/products
router.get('/', async (req, res) => {
  try{
    const products = await Product.find({});
    res.json(products);
  }catch(err){
    console.error(err);res.status(500).json({ message: 'Server error' });
  }
});

// helper: simple seller auth (Basic or headers)
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

// POST /api/products  (seller-only) - accepts multipart/form-data or JSON
router.post('/', upload.single('image'), async (req, res) => {
  try{
    if(!checkSellerAuth(req)) return res.status(401).json({ message: 'Unauthorized: seller credentials required' });

    let { name, description, price } = req.body;
    if(!name || !price) return res.status(400).json({ message: 'Missing name or price' });
    price = Number(price);
    let imageUrl = req.body.image || '';
    if(req.file){ imageUrl = `/uploads/${req.file.filename}`; }
    const p = new Product({ name, description, price, image: imageUrl });
    await p.save();
    res.json({ message: 'Product created', product: p });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/products/:id  (seller-only) - update product, accepts multipart/form-data
router.put('/:id', upload.single('image'), async (req, res) => {
  try{
    if(!checkSellerAuth(req)) return res.status(401).json({ message: 'Unauthorized' });
    const id = req.params.id;
    const p = await Product.findById(id);
    if(!p) return res.status(404).json({ message: 'Product not found' });
    const { name, description, price } = req.body;
    if(name !== undefined) p.name = name;
    if(description !== undefined) p.description = description;
    if(price !== undefined) p.price = Number(price);
    if(req.file){
      // delete old image file if existed and is under /uploads
      if(p.image && p.image.startsWith('/uploads/')){
        const old = path.join(__dirname, '..', 'public', p.image);
        try{ if(fs.existsSync(old)) fs.unlinkSync(old); }catch(e){ console.error('Failed to delete old image', e); }
      }
      p.image = `/uploads/${req.file.filename}`;
    }
    await p.save();
    res.json({ message: 'Product updated', product: p });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/products/:id (seller-only)
router.delete('/:id', async (req, res) => {
  try{
    if(!checkSellerAuth(req)) return res.status(401).json({ message: 'Unauthorized' });
    const id = req.params.id;
    const p = await Product.findById(id);
    if(!p) return res.status(404).json({ message: 'Product not found' });
    if(p.image && p.image.startsWith('/uploads/')){
      const img = path.join(__dirname, '..', 'public', p.image);
      try{ if(fs.existsSync(img)) fs.unlinkSync(img); }catch(e){ console.error('Failed to delete image', e); }
    }
    await p.deleteOne();
    res.json({ message: 'Product deleted' });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
