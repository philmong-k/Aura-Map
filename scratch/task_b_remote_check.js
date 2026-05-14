
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Connected to Remote Server for Integrity Check');
  
  const commands = [
    'grep -r "location /canvas/" /etc/nginx/',
    'cat /etc/nginx/sites-enabled/default' // Assuming default from previous check
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
      stream.on('close', () => {
        current++;
        run();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  };
  run();
}).connect(REMOTE_CONFIG);
