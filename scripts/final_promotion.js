
import { Client } from 'ssh2';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

const REMOTE_TARGET_PATH = '/usr/share/nginx/html';
const REMOTE_DOCKER_CONTAINER = 'agent-canvas';
const REMOTE_TEMP_TAR = '/home/philmong/dist.tar.gz';

async function deploy() {
  console.log('🚀 [C-Type Tactical Pipeline] Final Promotion to philmong.co.kr Starting...');
  
  try {
    // 1. Build locally on Windows
    console.log('📦 [Step 1] Preparing Tactical Payload...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. Create tarball
    execSync('tar -czf dist.tar.gz -C dist .');
    console.log('✅ Payload Ready: dist.tar.gz');

    // 3. Connect and Upload
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`🔗 Connected to Remote Command Center (${REMOTE_CONFIG.host})`);
      
      conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const readStream = fs.createReadStream('dist.tar.gz');
        const writeStream = sftp.createWriteStream(REMOTE_TEMP_TAR);
        
        console.log('📤 Transferring Payload via SFTP...');
        
        readStream.pipe(writeStream);
        
        writeStream.on('close', () => {
          console.log('✅ Transfer Successful.');
          
          // 4. Dual Deployment: Host Path + Docker Injection
          console.log('💉 [Step 2] Injecting Payload into Host and Production Container...');
          
          const commands = [
            // Host Deployment (Nginx alias path)
            `mkdir -p /home/philmong/agent-canvas/temp_dist`,
            `tar -xzf ${REMOTE_TEMP_TAR} -C /home/philmong/agent-canvas/temp_dist`,
            `rm -rf /home/philmong/agent-canvas/assets /home/philmong/agent-canvas/index.html /home/philmong/agent-canvas/favicon.svg /home/philmong/agent-canvas/icons.svg`,
            `cp -r /home/philmong/agent-canvas/temp_dist/. /home/philmong/agent-canvas/`,
            `rm -rf /home/philmong/agent-canvas/temp_dist`,
            
            // Docker Injection
            `docker exec ${REMOTE_DOCKER_CONTAINER} mkdir -p /tmp/dist_new`,
            `cat ${REMOTE_TEMP_TAR} | docker exec -i ${REMOTE_DOCKER_CONTAINER} tar -xzf - -C /tmp/dist_new`,
            `docker exec ${REMOTE_DOCKER_CONTAINER} rm -rf ${REMOTE_TARGET_PATH}/*`,
            `docker exec ${REMOTE_DOCKER_CONTAINER} cp -r /tmp/dist_new/. ${REMOTE_TARGET_PATH}/`,
            `docker exec ${REMOTE_DOCKER_CONTAINER} rm -rf /tmp/dist_new`,
            
            `rm ${REMOTE_TEMP_TAR}`
          ];
          
          let currentCommand = 0;
          const executeNext = () => {
            if (currentCommand >= commands.length) {
              console.log('✨ [Final Step] C-Type Tactical Pipeline (Dual-Track) 가동 완료!');
              console.log('🌍 Agent Canvas가 philmong.co.kr/canvas/ 에서 최신 상태(v4.6-PLATINUM)로 운영 중입니다.');
              conn.end();
              process.exit(0);
            }
            
            const cmd = commands[currentCommand];
            conn.exec(cmd, (err, stream) => {
              if (err) throw err;
              stream.on('close', () => {
                currentCommand++;
                executeNext();
              }).on('data', (data) => {
                process.stdout.write(data);
              }).stderr.on('data', (data) => {
                process.stderr.write(data);
              });
            });
          };
          
          executeNext();
        });
      });
    }).connect(REMOTE_CONFIG);
    
  } catch (error) {
    console.error('❌ Deployment Failed:', error);
    process.exit(1);
  }
}

deploy();
