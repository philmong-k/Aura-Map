const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // 1. 프로세스 목록 확인 (pm2, docker 등)
  // 2. Nginx 설정 파일 위치 확인
  conn.exec(`pm2 list || docker ps; ls -R /etc/nginx/sites-enabled/ || ls /etc/nginx/conf.d/;`, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('--- Server Environment Check ---');
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
