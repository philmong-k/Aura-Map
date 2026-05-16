const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. POST /api/tactical-map 응답에 updatedAt 추가
const targetLine = "res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });";
const replacementLine = "const finalRecord = await prisma.tacticalMap.findUnique({ where: { id: finalId } }); res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility, updated_at: finalRecord?.updatedAt });";

if (content.includes(targetLine)) {
    content = content.replace(targetLine, replacementLine);
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server now returns updated_at in POST response.');
} else {
    console.log('❌ Error: Could not find response line in server code.');
}
