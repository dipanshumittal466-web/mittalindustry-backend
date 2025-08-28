const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main(){
  const products = [
    { title: '12V Inverter Battery - 150Ah', description:'Deep cycle battery', price: 12000, brand:'VoltMaster', sku:'BAT-150' },
    { title: 'Pure Sine Wave Inverter 2kVA', description:'Stable output', price: 9500, brand:'PowerPro', sku:'INV-2K' },
    { title: 'Stabilizer 2kVA', description:'Protect devices', price: 3200, brand:'StabiSafe', sku:'STB-2K' }
  ];
  for(const p of products){
    await prisma.product.upsert({ where: { sku: p.sku }, update: p, create: p });
  }
  console.log('seed done');
}
main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>process.exit());
