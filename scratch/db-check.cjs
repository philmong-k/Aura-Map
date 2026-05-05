const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // DB에서 tactical_projects 테이블 조회
  // 테이블이 없는 경우를 대비해 테이블 목록부터 확인
  conn.exec(`mysql -u root -p'kasfsk76dd**' -e "USE aura_db; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='aura_db'; SELECT id, name, lastModified FROM tactical_projects LIMIT 20;"`, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('--- DB Query Results ---');
      console.log(output);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Error:', err.message);
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
