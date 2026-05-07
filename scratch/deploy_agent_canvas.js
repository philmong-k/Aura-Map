
import { Client } from 'ssh2';
import fs from 'fs';
import { execSync } from 'child_process';

const conn = new Client();
const remotePath = '/home/philmong/agent-canvas';
const zipName = 'agent-canvas-dist.tar.gz';

// 1. Zip the dist folder locally
console.log('Zipping dist folder...');
execSync(`tar -czf ${zipName} -C dist .`);

conn.on('ready', () => {
  console.log('Client :: ready');
  
  // 2. Ensure remote directory exists
  conn.exec(`mkdir -p ${remotePath}`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Remote directory checked.');
      
      // 3. Upload zip
      conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('Uploading zip...');
        sftp.fastPut(zipName, `/home/philmong/${zipName}`, (err) => {
          if (err) throw err;
          console.log('Zip uploaded.');
          
          // 4. Extract on remote
          const extractCmd = `
rm -rf ${remotePath}/*
tar -xzf /home/philmong/${zipName} -C ${remotePath}
rm /home/philmong/${zipName}
`;
          conn.exec(extractCmd, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
              console.log('Extracted on remote.');
              
              // 5. Update Nginx config
              console.log('Updating Nginx...');
              const nginxUpdateCmd = `
echo "kasfsk76dd**" | sudo -S cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
echo "kasfsk76dd**" | sudo -S sed -i '/location \\/canvas\\/ {/,/}/c\\    location /canvas/ {\\n        alias /home/philmong/agent-canvas/;\\n        index index.html;\\n        try_files $uri $uri/ /canvas/index.html;\\n    }' /etc/nginx/sites-enabled/default
echo "kasfsk76dd**" | sudo -S nginx -t && echo "kasfsk76dd**" | sudo -S systemctl reload nginx
`;
              conn.exec(nginxUpdateCmd, (err, stream) => {
                if (err) throw err;
                stream.on('close', () => {
                  console.log('Nginx updated and reloaded.');
                  conn.end();
                  // Clean up local zip
                  fs.unlinkSync(zipName);
                }).on('data', (data) => console.log('STDOUT: ' + data))
                  .stderr.on('data', (data) => console.log('STDERR: ' + data));
              });
            });
          });
        });
      });
    });
  });
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
