
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🗑️ Purging Production Tactical Data for Clean Mirroring...');
  
  const dbPass = 'kasfsk76dd**';
  const query = "DELETE FROM tactical_maps WHERE folder_name='Aura-Map';";
  const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Production DB (Aura-Map) is now EMPTY.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(REMOTE_CONFIG);
