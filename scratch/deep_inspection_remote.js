
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Deep Inspection of Production Server Starting...');
  
  const commands = [
    // 1. Nginx Config Deep Search
    'grep -r "canvas" /etc/nginx/',
    
    // 2. Host Filesystem Check
    'ls -lt /home/philmong/agent-canvas/index.html',
    'grep "assets/index-" /home/philmong/agent-canvas/index.html',
    'ls -lt /home/philmong/agent-canvas/assets | head -n 5',
    
    // 3. Docker Content Check
    'docker exec agent-canvas ls -lt /usr/share/nginx/html/index.html',
    'docker exec agent-canvas grep "assets/index-" /usr/share/nginx/html/index.html',
    
    // 4. Process Check
    'ps aux | grep nginx',
    'docker ps | grep agent-canvas'
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
