
import { PrismaClient } from '@prisma/client';
import { Client } from 'ssh2';

const prisma = new PrismaClient();
const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

async function mirrorTwo() {
  console.log('🚀 Mirroring the 2 Golden Projects to Production...');
  
  try {
    const maps = await prisma.tacticalMap.findMany({
      where: { userId: 'slo76k@gmail.com', folderName: 'Aura-Map' }
    });

    console.log(`📡 Found ${maps.length} projects in WSL2. Preparing to push...`);

    const conn = new Client();
    conn.on('ready', () => {
      let completed = 0;
      maps.forEach(m => {
        const dbPass = 'kasfsk76dd**';
        // Escape data for SQL
        const escapedData = m.data.replace(/'/g, "''").replace(/\\/g, "\\\\");
        const query = `INSERT INTO tactical_maps (id, userId, folderName, title, visibility, data, createdAt, updatedAt) VALUES (UUID(), '${m.userId}', '${m.folderName}', '${m.title}', '${m.visibility}', '${escapedData}', NOW(), NOW());`;
        const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          stream.on('close', () => {
            completed++;
            console.log(`✅ Synced: [${m.title}]`);
            if (completed === maps.length) {
              console.log('🎯 MIRRORING COMPLETE!');
              conn.end();
            }
          }).on('data', (data) => {
            // process.stdout.write(data);
          });
        });
      });
    }).connect(REMOTE_CONFIG);

  } catch (e) {
    console.error('❌ Mirroring Failed:', e.message);
  }
}

mirrorTwo();
