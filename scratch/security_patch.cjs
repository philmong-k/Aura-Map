const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 🛡️ [Security Patch] 하드코딩된 마스터 키를 .env 기반으로 교체
const hardcodedKey = "const MASTER_KEY = 'commander';";
const securedKey = "const MASTER_KEY = process.env.MASTER_KEY || 'commander';";

if (content.includes(hardcodedKey)) {
    content = content.replace(hardcodedKey, securedKey);
    fs.writeFileSync(path, content);
    console.log('✅ Success: Master Key secured via .env reference.');
} else {
    console.log('⚠️ Warning: Master Key already secured or pattern not found.');
}
