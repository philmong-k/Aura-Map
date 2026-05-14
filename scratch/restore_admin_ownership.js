
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Restoring Data Ownership to Admin Account...');
  
  const dbPass = 'kasfsk76dd**';
  // guest@aura.com으로 임시 이전했던 프로젝트들을 다시 slo76k@gmail.com으로 복구
  const query = "UPDATE tactical_maps SET user_id='slo76k@gmail.com' WHERE user_id='guest@aura.com' AND folder_name='Aura-Map';";
  const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ User ID mapping restored to slo76k@gmail.com.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(REMOTE_CONFIG);
