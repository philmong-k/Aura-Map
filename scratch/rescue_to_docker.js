
import { PrismaClient } from '@prisma/client';

const prismaLocal = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3308/aura_db' }
  }
});

const prismaDocker = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3306/aura_db' }
  }
});

async function rescueData() {
  console.log('🚑 [Rescue] Moving ALL projects from Local(3308) to Docker(3306)...');
  
  try {
    const maps = await prismaLocal.tacticalMap.findMany();
    console.log(`📡 Found ${maps.length} projects to rescue.`);

    for (const m of maps) {
      await prismaDocker.tacticalMap.upsert({
        where: { id: m.id },
        update: { data: m.data, updatedAt: new Date() },
        create: {
          id: m.id,
          userId: m.userId,
          folderName: m.folderName,
          title: m.title,
          visibility: m.visibility,
          data: m.data
        }
      });
      console.log(`   ✅ Rescued: [${m.title}]`);
    }
    console.log('🎯 [Rescue] ALL DATA MOVED TO DOCKER!');
  } catch (e) {
    console.error('❌ Rescue Failed:', e.message);
  } finally {
    await prismaLocal.$disconnect();
    await prismaDocker.$disconnect();
  }
}

rescueData();
