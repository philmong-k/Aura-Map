
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('🧐 Testing Prisma Query on Remote Server...');
  try {
    const maps = await prisma.tacticalMap.findMany({
      where: { 
        userId: 'slo76k@gmail.com',
        folderName: 'Aura-Map'
      }
    });
    console.log(`✅ Prisma found ${maps.length} maps.`);
    maps.forEach(m => console.log(` - ${m.title}`));
  } catch (e) {
    console.error('❌ Prisma Query Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
