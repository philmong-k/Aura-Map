
import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected to Production');
  conn.exec('docker inspect agent-canvas | grep -A 10 "Mounts"', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (data) => console.log('' + data));
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
