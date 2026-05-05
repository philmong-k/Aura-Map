const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // 1. 백엔드 서버 빌드 (tsc)
  // 2. pm2 재시작
  const script = `
    cd /home/philmong/Aura/server
    npm run build
    pm2 restart 0
    echo "🚀 Backend Rebuilt and Restarted with New CORS Config"
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log(output);
      conn.end();
    }).on('data', (data) => output += data.toString());
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
