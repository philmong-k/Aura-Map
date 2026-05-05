const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // 1. DB에서 tactical_projects 테이블 조회 (이름 확인)
  // 2. API 서버 프로세스 확인 및 로그 경로 탐색
  conn.exec(`mysql -u root -p'kasfsk76dd**' -e "USE aura_db; SHOW TABLES; SELECT id, name, lastModified FROM tactical_projects LIMIT 10;"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
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
