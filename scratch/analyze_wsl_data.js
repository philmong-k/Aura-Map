
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('🧐 Checking Local WSL2 Data (Detailed)...');
  try {
    const maps = await prisma.tacticalMap.findMany({
      where: { folderName: 'Aura-Map' }
    });
    console.log(`✅ Found ${maps.length} total maps in WSL2.`);
    for (const m of maps) {
      let valid = false;
      try {
        const d = JSON.parse(m.data);
        if (d.nodes && d.nodes.length > 0) valid = true;
      } catch(e) {}
      console.log(` - [${m.title}] | Valid: ${valid} | Size: ${m.data.length}`);
    }
  } catch (e) {
    console.error('❌ Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
