
import { Client } from 'ssh2';
import fs from 'fs';
import { execSync } from 'child_process';

const conn = new Client();
const remotePath = '/home/philmong/agent-canvas';
const zipName = 'agent-canvas-dist.tar.gz';

console.log('Zipping dist folder...');
execSync(`tar -czf ${zipName} -C dist .`);

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const runCmd = (cmd) => new Promise((resolve, reject) => {
    console.log(`Running: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        console.log(`Command closed with code ${code}`);
        resolve({ code, stdout, stderr });
      }).on('data', (data) => {
        stdout += data;
        console.log('STDOUT: ' + data);
      }).stderr.on('data', (data) => {
        stderr += data;
        console.log('STDERR: ' + data);
      });
    });
  });

  const uploadFile = (local, remote) => new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`Uploading ${local} to ${remote}...`);
      sftp.fastPut(local, remote, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  async function deploy() {
    try {
      await runCmd(`mkdir -p ${remotePath}`);
      await uploadFile(zipName, `/home/philmong/${zipName}`);
      await runCmd(`tar -xzf /home/philmong/${zipName} -C ${remotePath}`);
      await runCmd(`rm /home/philmong/${zipName}`);
      
      console.log('Updating Nginx...');
      // Backup
      await runCmd(`echo "kasfsk76dd**" | sudo -S cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak`);
      
      // Replace location block
      // We use a more specific sed to avoid issues
      const nginxConfig = await runCmd(`cat /etc/nginx/sites-enabled/default`);
      let content = nginxConfig.stdout;
      
      const targetBlock = /location \/canvas\/ \{[\s\S]*?\}/;
      const replacement = `location /canvas/ {
        alias /home/philmong/agent-canvas/;
        index index.html;
        try_files $uri $uri/ /canvas/index.html;
    }`;
      
      if (targetBlock.test(content)) {
        const newContent = content.replace(targetBlock, replacement);
        fs.writeFileSync('nginx_new', newContent);
        await uploadFile('nginx_new', '/home/philmong/nginx_new');
        await runCmd(`echo "kasfsk76dd**" | sudo -S mv /home/philmong/nginx_new /etc/nginx/sites-enabled/default`);
        await runCmd(`echo "kasfsk76dd**" | sudo -S nginx -t`);
        await runCmd(`echo "kasfsk76dd**" | sudo -S systemctl reload nginx`);
        console.log('Nginx updated successfully!');
        fs.unlinkSync('nginx_new');
      } else {
        console.error('Could not find /canvas/ block in Nginx config');
      }
      
    } catch (e) {
      console.error('Deployment failed:', e);
    } finally {
      conn.end();
      if (fs.existsSync(zipName)) fs.unlinkSync(zipName);
    }
  }

  deploy();
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
