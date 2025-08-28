require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// Health
app.get('/health', (req,res)=>res.json({ok:true}));
// Public products endpoint
app.get('/api/products', async (req,res)=>{
  const prods = await prisma.product.findMany({ take: 200 });
  res.json(prods);
});
// Single product
app.get('/api/products/:id', async (req,res)=>{
  const p = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  res.json(p);
});
// Auth - signup/login (simple JWT)
app.post('/api/signup', async (req,res)=>{
  const { name, email, password } = req.body;
  if(!email || !password) return res.status(400).json({error:'missing'});
  const hash = await bcrypt.hash(password,10);
  const u = await prisma.user.create({ data: { name, email, passwordHash: hash } });
  const token = jwt.sign({ userId: u.id }, process.env.JWT_SECRET || 'devsecret');
  res.json({ token, user: { id: u.id, email: u.email, name: u.name } });
});
app.post('/api/login', async (req,res)=>{
  const { email, password } = req.body;
  const u = await prisma.user.findUnique({ where: { email } });
  if(!u) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if(!ok) return res.status(401).json({ error: 'invalid' });
  const token = jwt.sign({ userId: u.id }, process.env.JWT_SECRET || 'devsecret');
  res.json({ token, user: { id: u.id, email: u.email, name: u.name } });
});
// Create order (mock create, payment handled client-side with Razorpay/Stripe)
app.post('/api/orders', async (req,res)=>{
  const { items, userId, amount, currency } = req.body;
  const order = await prisma.order.create({ data: { userId: userId || null, totalAmount: amount, currency: currency || 'INR', status: 'PENDING' } });
  // create order items
  if(Array.isArray(items)){
    for(const it of items){
      await prisma.orderItem.create({ data: { orderId: order.id, productId: Number(it.productId), quantity: Number(it.quantity || 1), price: Number(it.price || 0) } });
    }
  }
  res.json(order);
});
// Razorpay order creation skeleton
app.post('/api/payments/razorpay/create', async (req,res)=>{
  const Razorpay = require('razorpay');
  const razor = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || '', key_secret: process.env.RAZORPAY_KEY_SECRET || '' });
  const { amount, currency, receipt } = req.body;
  try{
    const order = await razor.orders.create({ amount: Math.round(amount*100), currency: currency||'INR', receipt: receipt||'rcpt_'+Date.now(), payment_capture: 1 });
    res.json(order);
  }catch(e){ console.error(e); res.status(500).json({ error: 'razorpay_failed' }) }
});
// Stripe skeleton
app.post('/api/payments/stripe/create-intent', async (req,res)=>{
  const Stripe = require('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET || '');
  const { amount, currency } = req.body;
  try{
    const intent = await stripe.paymentIntents.create({ amount: Math.round(amount*100), currency: currency||'inr' });
    res.json(intent);
  }catch(e){ console.error(e); res.status(500).json({ error: 'stripe_failed' }) }
});
// Basic admin order list
app.get('/api/admin/orders', async (req,res)=>{
  const list = await prisma.order.findMany({ include: { items: true }, take: 100 });
  res.json(list);
});
// Start
const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log('API listening on', port));


// --- Blog CMS endpoints ---
app.get('/api/blogs', async (req,res)=>{
  const blogs = await prisma.blog.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } });
  res.json(blogs);
});

app.get('/api/blogs/:slug', async (req,res)=>{
  const b = await prisma.blog.findUnique({ where: { slug: req.params.slug } });
  if(!b) return res.status(404).json({ error: 'not_found' });
  res.json(b);
});

// Admin CRUD (simple, no auth - recommend protecting with JWT in production)
app.post('/api/admin/blogs', async (req,res)=>{
  const { title, slug, content, excerpt, cover, tags, published } = req.body;
  if(!title || !slug || !content) return res.status(400).json({ error: 'missing' });
  try{
    const b = await prisma.blog.create({ data: { title, slug, content, excerpt, cover, tags, published: !!published } });
    res.json(b);
  }catch(e){ console.error(e); res.status(500).json({ error: 'db_error' }); }
});

app.put('/api/admin/blogs/:id', async (req,res)=>{
  const id = Number(req.params.id);
  const data = req.body;
  try{
    const b = await prisma.blog.update({ where: { id }, data });
    res.json(b);
  }catch(e){ console.error(e); res.status(500).json({ error: 'db_error' }); }
});

app.delete('/api/admin/blogs/:id', async (req,res)=>{
  const id = Number(req.params.id);
  try{ await prisma.blog.delete({ where: { id } }); res.json({ ok: true }); }catch(e){ console.error(e); res.status(500).json({ error: 'db_error' }); }
});

// --- end Blog CMS endpoints ---
