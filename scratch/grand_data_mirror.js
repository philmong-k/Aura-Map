
import { PrismaClient } from '@prisma/client';
import { Client } from 'ssh2';

const prismaWsl = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3306/aura_db' }
  }
});

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

async function grandDataMirror() {
  console.log('🚀 [Grand Mirror] Transferring REAL Tactical Data to Production Docker...');
  
  try {
    const maps = await prismaWsl.tacticalMap.findMany({
      where: { folderName: 'Aura-Map' }
    });

    console.log(`📡 Found ${maps.length} projects in WSL2 Docker.`);

    const conn = new Client();
    conn.on('ready', () => {
      const dbPass = 'kasfsk76dd**';
      // 1. 운영 서버 도커 DB 비우기
      const wipeCmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "DELETE FROM tactical_maps WHERE folder_name='Aura-Map';"`;
      
      conn.exec(wipeCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log('🗑️ Production DB Purged.');
          
          // 2. WSL2 데이터 주입
          let completed = 0;
          for (const m of maps) {
            const escapedData = m.data.replace(/'/g, "''").replace(/\\/g, "\\\\");
            const query = `INSERT INTO tactical_maps (id, userId, folderName, title, visibility, data, createdAt, updatedAt) VALUES (UUID(), '${m.userId}', '${m.folderName}', '${m.title}', '${m.visibility}', '${escapedData}', NOW(), NOW());`;
            const insertCmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

            conn.exec(insertCmd, (err, stream) => {
              if (err) throw err;
              stream.on('close', () => {
                completed++;
                console.log(`   ✅ Mirrored: [${m.title}]`);
                if (completed === maps.length) {
                  console.log('🎯 [Grand Mirror] DATA SYNC SUCCESS!');
                  conn.end();
                }
              });
            });
          }
          if (maps.length === 0) conn.end();
        });
      });
    }).connect(REMOTE_CONFIG);

  } catch (e) {
    console.error('❌ Mirroring Failed:', e.message);
  } finally {
    await prismaWsl.$disconnect();
  }
}

grandDataMirror();
