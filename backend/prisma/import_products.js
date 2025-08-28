const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function downloadImage(url, dest) {
  if(!url) return null;
  const res = await fetch(url);
  if(!res.ok) return null;
  const buffer = await res.buffer();
  fs.writeFileSync(dest, buffer);
  return dest;
}
async function main(){
  const dataDir = path.join(__dirname);
  const files = fs.readdirSync(dataDir).filter(f => f.toLowerCase().includes('product'));
  for(const f of files){
    const abs = path.join(dataDir,f);
    console.log('Processing', abs);
    const raw = fs.readFileSync(abs,'utf-8');
    let arr = [];
    try{ arr = JSON.parse(raw); }catch(e){ console.error('json parse error', e); continue; }
    for(const p of arr){
      const created = await prisma.product.upsert({ where: { sku: p.sku || p.id?.toString() || p.title.slice(0,30) }, update: { price: p.price || 0, title: p.title, description: p.description || '' }, create: { title: p.title, description: p.description || '', price: p.price || 0, brand: p.brand || '', sku: p.sku || p.id?.toString() } });
      if(p.image_url || p.image){
        const imgUrl = p.image_url || p.image;
        const outDir = path.join(__dirname,'..','public','images');
        try{ fs.mkdirSync(outDir,{ recursive:true }); }catch(e){}
        const fname = created.id + '_' + (p.sku||created.id) + '.jpg';
        const dest = path.join(outDir,fname);
        try{ await downloadImage(imgUrl,dest); await prisma.product.update({ where: { id: created.id }, data: { image: '/images/'+fname } }); }catch(e){ console.error('img download failed', e); }
      }
    }
  }
  console.log('Import complete');
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
