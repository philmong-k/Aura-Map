
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDelete() {
  const testTitle = 'DELETE_TEST_PROJECT';
  const testUserId = 'slo76k@gmail.com';

  console.log(`🚀 Starting Delete Integrity Test for [${testTitle}]...`);

  try {
    // 1. 생성
    console.log(' - Step 1: Creating test project in DB...');
    const created = await prisma.tacticalMap.create({
      data: {
        userId: testUserId,
        folderName: 'Aura-Map',
        title: testTitle,
        data: JSON.stringify({ nodes: [{ id: '1', data: { label: 'Test' } }] })
      }
    });
    console.log(`   ✅ Created with DB ID: ${created.id}`);

    // 2. 삭제 (UI 로직 시뮬레이션: title을 기반으로 검색 후 삭제)
    console.log(' - Step 2: Simulating UI Delete request...');
    const existing = await prisma.tacticalMap.findFirst({
      where: { userId: testUserId, folderName: 'Aura-Map', title: testTitle }
    });

    if (existing) {
      console.log('   ✅ Target found. Executing DELETE...');
      await prisma.tacticalMap.delete({ where: { id: existing.id } });
      console.log('   ✅ DELETE command executed successfully.');
    } else {
      console.warn('   ⚠️ Target NOT found! Delete operation would fail in production.');
    }

    // 3. 최종 확인
    console.log(' - Step 3: Verifying if data still exists in DB...');
    const remains = await prisma.tacticalMap.findFirst({
      where: { title: testTitle }
    });

    if (remains) {
      console.error('   ❌ FAILURE: Data still remains in DB after deletion!');
    } else {
      console.log('   🎯 SUCCESS: Data completely purged from DB.');
    }

  } catch (e) {
    console.error('❌ Test Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
