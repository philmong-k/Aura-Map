
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Mapping Tactical Maps to Guest Account...');
  
  const dbPass = 'kasfsk76dd**';
  // slo76k@gmail.com 소유의 프로젝트들을 guest@aura.com으로 변경하여 즉시 가시성 확보
  const query = "UPDATE tactical_maps SET user_id='guest@aura.com' WHERE user_id='slo76k@gmail.com' AND folder_name='Aura-Map';";
  const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ User ID mapping updated to guest@aura.com.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(REMOTE_CONFIG);
