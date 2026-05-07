
import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const cmd = `sed -i "/id: APP_IDS.QUICK_BUY,/,/category: 'GENERAL',/ s/category: 'GENERAL',/category: 'BUSINESS',/" /home/philmong/Aura/src/pages/Dashboard.tsx && pm2 restart aura-hub`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => console.log('STDOUT: '+d)).stderr.on('data', d => console.log('STDERR: '+d));
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
