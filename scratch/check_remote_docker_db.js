
import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec("docker exec quark-db mysql -u root -p'kasfsk76dd**' aura_db -e 'SELECT COUNT(*) FROM App; SELECT COUNT(*) FROM Feature; SELECT COUNT(*) FROM RolePermissionMapping;'", (err, stream) => {
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
