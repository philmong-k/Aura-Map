
import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  // Use the DATABASE_URL from .env to run prisma db push
  // We need to make sure npx is available and we are in the right directory
  const prismaCmd = 'cd /home/philmong/Aura/server && npx prisma db push';
  
  conn.exec(prismaCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`Prisma finished with code ${code}`);
      conn.end();
    }).on('data', (data) => {
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
