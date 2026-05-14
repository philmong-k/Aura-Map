
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeExceptTwo() {
  const keepers = ['제국 설계도 V3 - C타입 파이프라인', '전술장부테스트'];
  const user_id = 'slo76k@gmail.com';

  console.log('🧹 [WSL2 Purge] Initializing cleanup...');

  try {
    // 1. 보존할 프로젝트의 정확한 DB 레코드 확인
    // 타이틀(이름)이 DB의 title 컬럼에 있거나, data.projectName 내부에 있을 수 있음
    const allMaps = await prisma.tacticalMap.findMany({
      where: { userId: user_id, folderName: 'Aura-Map' }
    });

    const toKeep = [];
    const toDelete = [];

    for (const m of allMaps) {
      let isKeeper = false;
      try {
        const d = JSON.parse(m.data);
        const name = d.projectName || m.title;
        if (keepers.some(k => name.includes(k) || m.title.includes(k))) {
          isKeeper = true;
        }
      } catch (e) {
        if (keepers.some(k => m.title.includes(k))) isKeeper = true;
      }

      if (isKeeper) {
        toKeep.push(m);
      } else {
        toDelete.push(m);
      }
    }

    console.log(`🛡️ Keeping: ${toKeep.map(m => m.title).join(', ')}`);
    console.log(`🗑️ Deleting: ${toDelete.length} ghost projects...`);

    for (const m of toDelete) {
      await prisma.tacticalMap.delete({ where: { id: m.id } });
      console.log(`   ✅ Purged: [${m.title}]`);
    }

    console.log('✨ [WSL2 Purge] Local environment is now CRYSTAL CLEAR.');
  } catch (e) {
    console.error('❌ Purge Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

purgeExceptTwo();
