
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Injecting API Key and Restarting Backend...');
  
  const commands = [
    'sed -i "/VITE_TACTICAL_API_KEY/d" /home/philmong/projects/Aura/server/.env', // Remove existing if any
    'echo "VITE_TACTICAL_API_KEY=aura_platinum_key_2026" >> /home/philmong/projects/Aura/server/.env',
    'pm2 restart aura-backend'
  ];

  let current = 0;
  const run = () => {
    if (current >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[current];
    console.log(`\n--- [COMMAND]: ${cmd} ---`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => { current++; run(); }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  };
  run();
}).connect(REMOTE_CONFIG);
