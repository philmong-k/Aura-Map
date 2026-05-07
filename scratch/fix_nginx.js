
import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec('echo "kasfsk76dd**" | sudo -S rm /etc/nginx/sites-enabled/default.bak && echo "kasfsk76dd**" | sudo -S nginx -t && echo "kasfsk76dd**" | sudo -S systemctl reload nginx', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => console.log('STDOUT: '+d)).stderr.on('data', d => console.log('STDERR: '+d));
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
