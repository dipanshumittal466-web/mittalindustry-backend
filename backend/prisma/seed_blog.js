const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main(){
  await prisma.blog.upsert({
    where: { slug: 'best-inverter-battery-2025' },
    update: {},
    create: {
      title: 'Best Inverter Battery for Home & Office 2025',
      slug: 'best-inverter-battery-2025',
      content: '<h2>Top picks</h2><p>Discover the best inverter batteries for 2025...</p>',
      excerpt: 'Top inverter batteries for home and office in 2025.',
      cover: '',
      tags: 'battery,inverter,guide',
      published: true
    }
  });
  console.log('Seed blog done'); process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
