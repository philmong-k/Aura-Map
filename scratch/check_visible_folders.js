
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Checking Folder Names of Visible Projects...');
  
  const dbPass = 'kasfsk76dd**';
  const query = "SELECT title, folder_name, user_id FROM tactical_maps WHERE title IN ('proj-blueprint-v3', '기본 프로젝트', 'proj-aura-master-plan-v3');";
  const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(REMOTE_CONFIG);
