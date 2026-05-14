
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  console.log('🧪 [Debug] Real-time Database Query Test in Production...');
  try {
    const count = await prisma.tacticalMap.count();
    console.log(`📊 Total maps in DB: ${count}`);

    const user_id = 'slo76k@gmail.com';
    const maps = await prisma.tacticalMap.findMany({
      where: { userId: user_id }
    });
    console.log(`👤 Target User: ${user_id}`);
    console.log(`📑 Maps Found: ${maps.length}`);
    
    for (const m of maps) {
      console.log(`   - [${m.title}] | Folder: ${m.folderName}`);
    }
  } catch (e) {
    console.error('❌ Query Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
