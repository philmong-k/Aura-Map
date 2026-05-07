
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
      
      // 2. Download to a place WSL can access (e.g. current dir)
      const localZipPath = zipName;
      await downloadFile(`/home/philmong/${zipName}`, localZipPath);
      
      // 3. Clean up on remote
      await runCmd(`rm /home/philmong/${zipName}`);
      
      console.log('Download finished. Now extracting via WSL...');
      
      // 4. Extract via WSL to avoid Windows tar issues with filenames
      // We'll extract directly to the WSL Aura project folder
      const wslPath = '/home/philmong/projects/Aura';
      execSync(`wsl -d Ubuntu mkdir -p ${wslPath}`);
      execSync(`wsl -d Ubuntu rm -rf ${wslPath}/*`);
      // Copy zip to WSL temp
      execSync(`wsl -d Ubuntu cp /mnt/c/Users/slo76/My_projects/agent-canvas/${zipName} /tmp/${zipName}`);
      // Extract in WSL
      execSync(`wsl -d Ubuntu tar -xzf /tmp/${zipName} -C ${wslPath}`);
      execSync(`wsl -d Ubuntu rm /tmp/${zipName}`);
      
      // 5. Sync back to Windows workspace (if needed)
      console.log('Syncing WSL Aura back to Windows workspace...');
      execSync(`xcopy /E /I /Y \\\\wsl.localhost\\Ubuntu\\home\\philmong\\projects\\Aura c:\\Users\\slo76\\My_projects\\Aura`);
      
      console.log('Aura successfully pulled and deployed to WSL2 and Windows workspace!');
      
    } catch (e) {
      console.error('Pull failed:', e);
    } finally {
      conn.end();
      if (fs.existsSync(zipName)) fs.unlinkSync(zipName);
    }
  }

  pull();
}).connect({
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
});
