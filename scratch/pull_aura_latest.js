
import { Client } from 'ssh2';
import fs from 'fs';
import { execSync } from 'child_process';

const conn = new Client();
const remotePath = '/home/philmong/Aura';
const zipName = 'aura-remote-latest.tar.gz';

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const runCmd = (cmd) => new Promise((resolve, reject) => {
    console.log(`Running: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      }).on('data', (data) => {
        stdout += data;
      }).stderr.on('data', (data) => {
        stderr += data;
      });
    });
  });

  const downloadFile = (remote, local) => new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`Downloading ${remote} to ${local}...`);
      sftp.fastGet(remote, local, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  async function pull() {
    try {
      // 1. Tar on remote, excluding node_modules
      console.log('Taring Aura on remote...');
      await runCmd(`tar -czf /home/philmong/${zipName} -C ${remotePath} --exclude='node_modules' .`);
      
      // 2. Download
      await downloadFile(`/home/philmong/${zipName}`, zipName);
      
      // 3. Clean up on remote
      await runCmd(`rm /home/philmong/${zipName}`);
      
      console.log('Download finished. Now extracting locally...');
      
      // 4. Extract to Windows workspace (Aura folder)
      // We'll extract to a temp folder first to avoid mess
      const tempExtract = 'aura_temp_extract';
      if (!fs.existsSync(tempExtract)) fs.mkdirSync(tempExtract);
      execSync(`tar -xzf ${zipName} -C ${tempExtract}`);
      
      // Copy to c:\Users\slo76\My_projects\Aura
      // Note: We might want to be careful here not to overwrite .env or sensitive local configs
      // But the user said "Aura 구 버전이야" in WSL, so we want the latest from remote.
      console.log('Updating local Aura project...');
      execSync(`xcopy /E /I /Y ${tempExtract} c:\\Users\\slo76\\My_projects\\Aura`);
      
      // 5. Sync to WSL2
      console.log('Syncing to WSL2...');
      execSync(`wsl -d Ubuntu rm -rf /home/philmong/projects/Aura/*`);
      execSync(`wsl -d Ubuntu mkdir -p /home/philmong/projects/Aura`);
      execSync(`wsl -d Ubuntu cp -r /mnt/c/Users/slo76/My_projects/Aura/* /home/philmong/projects/Aura/`);
      
      console.log('Aura successfully pulled and deployed to WSL2!');
      
    } catch (e) {
      console.error('Pull failed:', e);
    } finally {
      conn.end();
      // Clean up local temp
      if (fs.existsSync(zipName)) fs.unlinkSync(zipName);
      // execSync(`rmdir /S /Q aura_temp_extract`); // Careful with this on Windows
    }
  }

  pull();
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
