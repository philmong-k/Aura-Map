const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 🛡️ [Emergency Fix v2] 더 유연한 검색으로 중복 제거
const lines = content.split('\n');
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
    // 300라인 이후에 갑자기 import가 나오면 그게 범인임
    if (i > 300 && lines[i].includes("import jwt from 'jsonwebtoken'")) {
        startLine = i;
    }
    // 중복된 API 등록의 마지막 부분을 찾음
    if (startLine !== -1 && lines[i].includes("app.use('/api/tactical', tacticalRouter)")) {
        endLine = i;
        break;
    }
}

if (startLine !== -1 && endLine !== -1) {
    console.log(`🚀 Deleting lines ${startLine + 1} to ${endLine + 1}...`);
    // startLine - 1 (바로 위 ");" 다음줄부터)
    const newLines = [
        ...lines.slice(0, startLine),
        ...lines.slice(endLine + 1)
    ];
    fs.writeFileSync(path, newLines.join('\n'));
    console.log('✅ Success: Duplicated block removed.');
} else {
    console.log(`❌ Error: startLine=${startLine}, endLine=${endLine}`);
}
