
import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -C 5 "Quick-Buy Manager" /home/philmong/Aura/src/pages/Dashboard.tsx', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (data) => {
      console.log('STDOUT: ' + data);
    });
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
