const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // tactical.ts의 동기화 핸들러 부분 집중 조회
  conn.exec(`cat /home/philmong/Aura/server/src/routes/tactical.ts`, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('--- Tactical Route Source ---');
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
