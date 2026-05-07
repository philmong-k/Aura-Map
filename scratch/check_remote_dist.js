
import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -d /home/philmong/Aura/dist', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Dist folder exists: ' + (code === 0));
      conn.end();
    });
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
