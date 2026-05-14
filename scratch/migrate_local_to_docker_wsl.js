
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prismaLocal = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3306/aura_db' }
  }
});

async function migrateToDocker() {
  console.log('🚀 Migrating WSL2 Local (3306) -> WSL2 Docker (3307)...');
  
  try {
    const maps = await prismaLocal.tacticalMap.findMany({
      where: { userId: 'slo76k@gmail.com', folderName: 'Aura-Map' }
    });

    console.log(`📡 Found ${maps.length} projects in Local DB.`);

    for (const m of maps) {
      const dbPass = 'kasfsk76dd**';
      const escapedData = m.data.replace(/'/g, "''").replace(/\\/g, "\\\\");
      const query = `INSERT INTO tactical_maps (id, userId, folderName, title, visibility, data, createdAt, updatedAt) VALUES (UUID(), '${m.userId}', '${m.folderName}', '${m.title}', '${m.visibility}', '${escapedData}', NOW(), NOW());`;
      const cmd = `wsl mariadb -u root -p'${dbPass}' --port=3307 aura_db -e "${query}"`;
      
      execSync(cmd);
      console.log(`   ✅ Migrated to Docker: [${m.title}]`);
    }

    console.log('🎯 LOCAL TO DOCKER MIGRATION COMPLETE!');
  } catch (e) {
    console.error('❌ Migration Failed:', e.message);
  } finally {
    await prismaLocal.$disconnect();
  }
}

migrateToDocker();
