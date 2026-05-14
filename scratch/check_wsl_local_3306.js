
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3306/aura_db' }
  }
});

async function check() {
  try {
    const maps = await prisma.tacticalMap.findMany();
    console.log(`📊 Found ${maps.length} projects in Local DB (3306).`);
    maps.forEach(m => console.log(` - ${m.title}`));
  } catch (e) {
    console.error('❌ Check Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
