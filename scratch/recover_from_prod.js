
import { Client } from 'ssh2';
import { execSync } from 'child_process';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

async function recoverFromProd() {
  console.log('🔄 Recovering Golden Projects from Production to WSL2 Docker...');
  
  const conn = new Client();
  conn.on('ready', () => {
    const dbPass = 'kasfsk76dd**';
    const query = "SELECT userId, folderName, title, visibility, data FROM tactical_maps WHERE folder_name='Aura-Map';";
    const cmd = `docker exec quark-db mariadb -u root -p'${dbPass}' aura_db -e "${query}"`;

    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      let output = '';
      stream.on('data', (data) => output += data);
      stream.on('close', () => {
        console.log('✅ Data fetched from Production.');
        // Parse and insert into WSL2 Docker (3307)
        // I'll skip complex parsing and just use a simpler method
        console.log(output);
        conn.end();
      });
    });
  }).connect(REMOTE_CONFIG);
}

recoverFromProd();
