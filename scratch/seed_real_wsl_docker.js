
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3306/aura_db' }
  }
});

async function seedRealData() {
  console.log('🚀 [Dev Sync] Injecting REAL Tactical Data into WSL2 Docker...');
  
  const goldenProjects = [
    {
      id: 'proj-blueprint-v3',
      title: 'proj-blueprint-v3',
      name: '제국 설계도 V3 - C타입 파이프라인',
      data: JSON.stringify({
        projectName: '제국 설계도 V3 - C타입 파이프라인',
        nodes: [
          { id: 'node-1', type: 'tactical', position: { x: 100, y: 100 }, data: { label: '본진 (WSL2)' } },
          { id: 'node-2', type: 'tactical', position: { x: 300, y: 100 }, data: { label: '전방 (Remote)' } }
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2', label: '미러링 보급로' }
        ]
      })
    },
    {
      id: 'New Tactical Plan',
      title: 'New Tactical Plan',
      name: '전술장부테스트',
      data: JSON.stringify({
        projectName: '전술장부테스트',
        nodes: [
          { id: 't-1', type: 'tactical', position: { x: 200, y: 200 }, data: { label: '장부 데이터 검증 노드' } }
        ],
        edges: []
      })
    }
  ];

  try {
    // 기존 찌꺼기 제거
    await prisma.tacticalMap.deleteMany({ where: { folderName: 'Aura-Map' } });

    for (const p of goldenProjects) {
      await prisma.tacticalMap.create({
        data: {
          userId: 'slo76k@gmail.com',
          folderName: 'Aura-Map',
          title: p.title,
          visibility: 'SHARED',
          data: p.data
        }
      });
      console.log(`   ✅ Injected: [${p.name}]`);
    }
    console.log('🎯 [Dev Sync] WSL2 Docker is now ALIVE with real nodes.');
  } catch (e) {
    console.error('❌ Injection Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedRealData();
