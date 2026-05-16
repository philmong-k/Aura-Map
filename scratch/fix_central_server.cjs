const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');
const target = "res.json({ message: '✅ 전술 데이터가 지정된 폴더에 저장되었습니다.', user_id, folder_name, title, visibility });";
const replacement = `
    const savedMap = existing || await prisma.tacticalMap.findFirst({
      where: { userId: String(user_id), folderName: folder_name, title: title }
    });
    res.json({ message: '✅ 전술 데이터 저장 완료', id: savedMap?.id, user_id, folder_name, title, visibility });
`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server code updated.');
} else {
    console.log('❌ Error: Target string not found.');
    process.exit(1);
}
