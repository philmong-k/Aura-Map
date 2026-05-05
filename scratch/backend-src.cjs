const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // 1. 서버 소스 파일 목록 확인
  // 2. package.json 확인 (라이브러리 파악)
  conn.exec(`ls -F /home/philmong/Aura/server; cat /home/philmong/Aura/server/package.json`, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('--- Backend Source List & package.json ---');
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
