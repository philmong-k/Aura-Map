
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Dual-Mapping Tactical Data (Guest + Admin)...');
  
  const dbPass = 'kasfsk76dd**';
  // 1. 기존에 slo76k@gmail.com으로 넣었던 것들을 guest@aura.com으로도 복제하여 가시성 200% 확보
  const query = `
    INSERT INTO tactical_maps (id, userId, folderName, title, visibility, data, createdAt, updatedAt)
    SELECT UUID(), 'guest@aura.com', folderName, title, visibility, data, NOW(), NOW()
    FROM tactical_maps
    WHERE userId = 'slo76k@gmail.com' AND folderName = 'Aura-Map'
    ON DUPLICATE KEY UPDATE updatedAt = NOW();
  `;
  const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Dual-mapping complete. Both Admin and Guest can now see the projects.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(REMOTE_CONFIG);
