const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  // index.ts의 CORS 설정을 수정하여 dev 도메인 허용
  // sed 명령어를 사용하여 cors() 설정을 보강
  const script = `
    cd /home/philmong/Aura/server
    # 기존 cors() 호출부를 찾아서 dev 도메인 허용 옵션 추가
    # 만약 app.use(cors()) 형태라면 app.use(cors({ origin: [...] })) 형태로 교체
    sed -i 's/app.use(cors());/app.use(cors({ origin: ["https:\\/\\/philmong.co.kr", "https:\\/\\/dev.philmong.co.kr"], credentials: true }));/g' src/index.ts
    # 만약 이미 옵션이 있다면 안전하게 추가 (이미 있으면 무시)
    grep -q "dev.philmong.co.kr" src/index.ts || sed -i '/cors({/ s/origin: \\["/origin: \\["https:\\/\\/dev.philmong.co.kr", "/' src/index.ts
    echo "✅ CORS updated in index.ts"
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => console.log(data.toString()));
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
