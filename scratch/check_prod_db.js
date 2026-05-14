
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Checking Production Database for Synced Maps...');
  
  // MariaDB root password is the same as SSH usually or as specified in handover
  const dbPass = 'kasfsk76dd**';
  const query = "SELECT title, userId, folderName, updatedAt FROM aura_db.TacticalMap ORDER BY updatedAt DESC LIMIT 20;";
  const cmd = `mysql -u root -p'${dbPass}' -e "${query}"`;

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
