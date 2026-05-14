
import { Client } from 'ssh2'; // Even for local WSL, SSH is sometimes easier or I can just use child_process

import { execSync } from 'child_process';

function runWSL(cmd) {
  try {
    const output = execSync(`wsl -d Ubuntu sh -c "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    console.log(output);
  } catch (e) {
    console.error(e.stdout || e.message);
  }
}

console.log('🛡️ Auditing WSL2 MariaDB Baseline...');

const dbPass = 'kasfsk76dd**';
const query = "SHOW VARIABLES LIKE '%packet%'; SHOW VARIABLES LIKE '%timeout%'; SELECT folder_name, user_id, COUNT(*) as count FROM tactical_maps GROUP BY folder_name, user_id;";
const cmd = `mariadb -u root -p'${dbPass}' aura_db -e \\"${query}\\"`;

runWSL(cmd);
