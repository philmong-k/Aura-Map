
import { Client } from 'ssh2';
import { execSync } from 'child_process';

function runWSL(cmd) {
  try {
    const output = execSync(`wsl -d Ubuntu sh -c "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    console.log(output);
  } catch (e) {
    console.error(e.stdout || e.message);
  }
}

const dbPass = 'kasfsk76dd**';
const query = "SELECT id, title FROM tactical_maps WHERE folder_name='Aura-Map';";
const cmd = `mariadb -u root -p'${dbPass}' aura_db -e \\"${query}\\"`;

runWSL(cmd);
