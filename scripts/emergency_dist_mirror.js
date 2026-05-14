
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

const WSL2_DIST_PATH = '/home/philmong/agent-canvas/dist/';
const LOCAL_DIST_PATH = './dist';

async function emergencyMirror() {
  console.log('🚨 [Emergency Protocol] Starting Dist-Direct Mirroring...');
  
  try {
    // 1. Sync from WSL2 to Local Staging
    console.log('🔄 [Step 1] Syncing Golden Build from WSL2...');
    // WSL2의 dist를 현재 작업 디렉토리의 dist로 가져옴
    execSync(`wsl -d Ubuntu rsync -av --delete ${WSL2_DIST_PATH} /mnt/c/Users/slo76/My_projects/agent-canvas/dist/`, { stdio: 'inherit' });
    
    // 2. Verify Version in synced files
    const indexContent = fs.readFileSync(path.join(LOCAL_DIST_PATH, 'index.html'), 'utf8');
    console.log('🧐 [Step 2] Verifying Assets in Local Staging...');
    
    // index.html에서 참조하는 메인 JS 파일 찾기
    const jsMatch = indexContent.match(/src="\/canvas\/assets\/(index-[^"]+\.js)"/);
    if (jsMatch) {
      const jsFile = jsMatch[1];
      const jsPath = path.join(LOCAL_DIST_PATH, 'assets', jsFile);
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      if (jsContent.includes('v4.6-PLATINUM')) {
        console.log(`✅ Version Verified: v4.6-PLATINUM found in ${jsFile}`);
      } else {
        console.warn('⚠️ Warning: v4.6-PLATINUM string NOT found in main JS asset.');
      }
    }

    // 3. Create tarball for promotion
    console.log('📦 [Step 3] Preparing Promotion Payload...');
    execSync('tar -czf dist.tar.gz -C dist .');
    
    // 4. Connect and Upload
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`🔗 Connected to Remote Server (${REMOTE_CONFIG.host})`);
      
      conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const readStream = fs.createReadStream('dist.tar.gz');
        const writeStream = sftp.createWriteStream(REMOTE_TEMP_TAR);
        
        console.log('📤 Transferring Payload to Production...');
        readStream.pipe(writeStream);
        
        writeStream.on('close', () => {
          console.log('✅ Transfer Successful.');
          
          // 5. Dual Deployment
          console.log('💉 [Step 4] Injecting Golden Build into Host and Container...');
          
          const commands = [
            // Host Deployment
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
          
          let current = 0;
          const next = () => {
            if (current >= commands.length) {
              console.log('✨ [Final] Emergency Dist-Direct Mirroring 완수!');
              console.log('🌍 운영 서버가 WSL2의 검증된 v4.6-PLATINUM 자산으로 갱신되었습니다.');
              conn.end();
              process.exit(0);
            }
            conn.exec(commands[current], (err, stream) => {
              if (err) throw err;
              stream.on('close', () => { current++; next(); });
            });
          };
          next();
        });
      });
    }).connect(REMOTE_CONFIG);
    
  } catch (error) {
    console.error('❌ Emergency Mirroring Failed:', error);
    process.exit(1);
  }
}

emergencyMirror();
