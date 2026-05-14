
import { Client } from 'ssh2';
import fs from 'fs';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('🚀 Starting Trace Deployment...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const readStream = fs.createReadStream('dist.tar.gz');
    const writeStream = sftp.createWriteStream('/home/philmong/dist_trace.tar.gz');
    
    readStream.pipe(writeStream);
    
    writeStream.on('close', () => {
      console.log('✅ dist_trace.tar.gz uploaded.');
      
      const commands = [
        'mkdir -p /home/philmong/agent-canvas/trace_dist',
        'tar -xzf /home/philmong/dist_trace.tar.gz -C /home/philmong/agent-canvas/trace_dist',
        'ls -R /home/philmong/agent-canvas/trace_dist',
        'grep "index-" /home/philmong/agent-canvas/trace_dist/index.html',
        'rm -rf /home/philmong/agent-canvas/assets /home/philmong/agent-canvas/index.html',
        'cp -r /home/philmong/agent-canvas/trace_dist/. /home/philmong/agent-canvas/',
        'ls -lt /home/philmong/agent-canvas/index.html',
        'rm -rf /home/philmong/agent-canvas/trace_dist /home/philmong/dist_trace.tar.gz'
      ];

      let current = 0;
      const run = () => {
        if (current >= commands.length) {
          conn.end();
          return;
        }
        const cmd = commands[current];
        console.log(`\n--- [COMMAND]: ${cmd} ---`);
        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          stream.on('close', (code) => {
            console.log(`[Exit Code]: ${code}`);
            current++;
            run();
          }).on('data', (data) => {
            process.stdout.write(data);
          }).stderr.on('data', (data) => {
            process.stderr.write(data);
          });
        });
      };
      run();
    });
  });
}).connect(REMOTE_CONFIG);
