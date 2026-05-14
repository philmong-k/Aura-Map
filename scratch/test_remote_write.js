
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🔗 Debugging Deployment Injection...');
  
  // 1. Check if we can write to the target directory
  const commands = [
    'touch /home/philmong/agent-canvas/test_write.txt',
    'ls -l /home/philmong/agent-canvas/test_write.txt',
    'rm /home/philmong/agent-canvas/test_write.txt',
    'ls -ld /home/philmong/agent-canvas'
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
