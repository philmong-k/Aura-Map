
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

const REMOTE_DOCKER_CONTAINER = 'agent-canvas';
const REMOTE_TEMP_TAR = '/home/philmong/dist.tar.gz';
const REMOTE_TARGET_PATH = '/usr/share/nginx/html';

async function executeFinalPromotion() {
  console.log('🚀 [C-Type Tactical Pipeline] Final Promotion to philmong.co.kr Starting...');

  // 1. Build and Compress
  console.log('📦 [Step 1] Preparing Tactical Payload...');
  execSync('npm run build', { stdio: 'inherit' });
  execSync('tar -czf dist.tar.gz -C dist .');
  console.log('✅ Payload Ready: dist.tar.gz');

  // 2. Connect and Transfer
  const conn = new Client();
  
  conn.on('ready', () => {
    console.log('🔗 Connected to Remote Command Center (100.95.147.38)');
    
    conn.sftp((err, sftp) => {
      if (err) throw err;
      
      console.log('📤 Transferring Payload via SFTP...');
      const readStream = fs.createReadStream('dist.tar.gz');
      const writeStream = sftp.createWriteStream(REMOTE_TEMP_TAR);
      
      writeStream.on('close', () => {
        console.log('✅ Transfer Successful.');
        
        // 3. Inject into Docker
        console.log('💉 [Step 2] Injecting Payload into Production Container...');
        
        // Create temp dir in container, extract, and replace
        const commands = [
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
            console.log('✨ [Final Step] C-Type Tactical Pipeline 가동 완료!');
            console.log('🌍 Agent Canvas가 philmong.co.kr/canvas/ 에서 최신 상태로 운영 중입니다.');
            conn.end();
            process.exit(0);
          }
          
          const cmd = commands[currentCommand];
          conn.exec(cmd, (err, stream) => {
            if (err) {
              console.error(`❌ Command failed: ${cmd}`);
              conn.end();
              process.exit(1);
            }
            stream.on('close', () => {
              currentCommand++;
              executeNext();
            }).on('data', (data) => {
              // console.log('STDOUT: ' + data);
            });
          });
        };
        
        executeNext();
      });
      
      readStream.pipe(writeStream);
    });
  }).connect(REMOTE_CONFIG);
}

executeFinalPromotion().catch(err => {
  console.error('🚨 Pipeline Critical Failure:', err);
  process.exit(1);
});
