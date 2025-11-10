const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmtohome';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('Mongo connected for seed'))
  .catch(err => console.error('Mongo connection error', err));

const products = [
  { name: 'Organic Alphonso Mangoes', price: 399, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=60', description: 'Premium Alphonso mangoes (6 pieces)' },
  { name: 'Fresh Coconuts', price: 75, image: 'https://images.unsplash.com/photo-1581375321224-79da6fd32f6e?w=800&q=60', description: 'Tender coconuts for drinking (2 pieces)' },
  { name: 'Organic Basmati Rice', price: 249, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=60', description: 'Premium aged basmati rice (1 kg)' },
  { name: 'Fresh Paneer', price: 159, image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=800&q=60', description: 'Fresh homemade paneer (500g)' },
  { name: 'Organic Turmeric Powder', price: 89, image: 'https://images.unsplash.com/photo-1615485500704-8e990f9e6634?w=800&q=60', description: 'Pure organic turmeric powder (100g)' },
  { name: 'Fresh Curry Leaves', price: 29, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=60', description: 'Fresh curry leaves bunch' }
];

async function seed(){
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log('Seeded products');
  mongoose.disconnect();
}

seed().catch(err => console.error(err));
