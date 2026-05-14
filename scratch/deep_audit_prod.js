
const { Client } = require('ssh2');

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

async function deepAudit() {
  const conn = new Client();
  conn.on('ready', () => {
    console.log('🔍 [Audit] Starting Deep System Audit on Production...');
    
    const commands = [
      'echo "--- [Nginx Proxy Cache Settings] ---"; grep -r "proxy_cache" /etc/nginx/',
      'echo "--- [Active Ports 3000-3005] ---"; sudo netstat -tulpn | grep -E "3000|3001|3002|3003|3004|3005"',
      'echo "--- [MariaDB Active Connections] ---"; docker exec quark-db mariadb -u root -p"kasfsk76dd**" -e "SHOW PROCESSLIST;"',
      'echo "--- [Backend Directory Integrity] ---"; ls -la /home/philmong/projects/Aura/server/',
      'echo "--- [Frontend Build Content Check] ---"; grep "philmong.co.kr" /home/philmong/agent-canvas/dist/assets/*.js | head -n 1'
    ];

    let completed = 0;
    commands.forEach(cmd => {
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => process.stdout.write(data));
        stream.on('close', () => {
          completed++;
          if (completed === commands.length) conn.end();
        });
      });
    });
  }).connect(REMOTE_CONFIG);
}

deepAudit();
