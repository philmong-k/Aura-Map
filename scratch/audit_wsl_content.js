
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function audit() {
  console.log('🧐 Deep Auditing WSL2 Tactical Maps Content...');
  try {
    const maps = await prisma.tacticalMap.findMany({
      where: { userId: 'slo76k@gmail.com', folderName: 'Aura-Map' }
    });

    console.log(`📊 Total Found: ${maps.length}`);
    for (const m of maps) {
      let nodeCount = 0;
      let isValidJSON = false;
      try {
        const d = JSON.parse(m.data);
        nodeCount = d.nodes?.length || 0;
        isValidJSON = true;
      } catch (e) {}

      console.log(` - [${m.title}] | Nodes: ${nodeCount} | JSON: ${isValidJSON} | Visibility: ${m.visibility} | ID: ${m.id}`);
    }
  } catch (e) {
    console.error('❌ Audit Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
