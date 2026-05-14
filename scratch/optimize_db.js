
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Optimizing MariaDB for Large Data...');
  
  const dbPass = 'kasfsk76dd**';
  const query = "SET GLOBAL max_allowed_packet=1073741824;"; // 1GB
  const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' -e "${query}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ MariaDB max_allowed_packet increased.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(REMOTE_CONFIG);
