
import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  // Check port 3002 and get recent logs
  conn.exec('netstat -tuln | grep 3002; tail -n 100 /home/philmong/.pm2/logs/aura-backend-out.log; tail -n 100 /home/philmong/.pm2/logs/aura-backend-error.log', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', (data) => {
      console.log('STDOUT: ' + data);
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
