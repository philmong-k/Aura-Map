const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // 1. tactical 라우트 코드 확인
  // 2. index.ts의 CORS 설정 확인
  conn.exec(`cat /home/philmong/Aura/server/src/routes/tactical.ts; echo "--- SEPARATOR ---"; cat /home/philmong/Aura/server/src/index.ts`, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('--- Tactical Route & Index Config ---');
      console.log(output);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
