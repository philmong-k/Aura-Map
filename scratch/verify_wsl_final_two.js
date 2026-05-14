
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
const query = "SELECT title, data FROM tactical_maps WHERE title='New Tactical Plan' OR title='proj-blueprint-v3';";
const cmd = `mariadb -u root -p'${dbPass}' aura_db -e \\"${query}\\"`;

runWSL(cmd);
