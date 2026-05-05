const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // index.ts의 CORS 설정을 최적화 (maxAge 추가)
  const script = `
    cd /home/philmong/Aura/server
    # CORS 설정에 maxAge 추가 (86400초 = 24시간 동안 예비 요청 생략)
    sed -i 's/credentials: true/credentials: true, maxAge: 86400/g' src/index.ts
    
    # 변경 사항 반영을 위한 빌드 및 재시작
    npm run build
    pm2 restart 0
    echo "🚀 Backend Sync Speed Optimized (CORS MaxAge Applied)"
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
