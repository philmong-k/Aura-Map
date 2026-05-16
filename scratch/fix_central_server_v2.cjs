const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix POST /api/tactical-map (Save)
const saveTarget = "data: data as any";
const saveReplacement = "data: JSON.stringify(data)";
// We need to be careful with multiple occurrences.
// Let's find the specific block for tactical-map save.

// Since I already modified this file once, I'll search for the current state.
const postTarget = "data: data as any"; 
// In Prisma create/update blocks.

content = content.replace(/data: data as any/g, "data: JSON.stringify(data)");

// 2. Fix the response ID logic (Ensuring it's correct)
// My previous edit replaced:
// res.json({ message: '✅ 전술 데이터가 지정된 폴더에 저장되었습니다.', user_id, folder_name, title, visibility });
// with:
// const savedMap = existing || await prisma.tacticalMap.findFirst({ where: { userId: String(user_id), folderName: folder_name, title: title } }); 
// res.json({ message: '✅ 전술 데이터 저장 완료', id: savedMap?.id, user_id, folder_name, title, visibility });

// But wait! If it's a NEW creation, 'savedMap' should be the result of prisma.tacticalMap.create.
// Let's refine the code to be more robust.

const refinedSaveLogic = `
    const savedData = JSON.stringify(data);
    let finalId;

    if (existing) {
      // 기존 레코드 업데이트
      const updated = await prisma.tacticalMap.update({
        where: { id: existing.id },
        data: { data: savedData, visibility, updatedAt: new Date() }
      });
      finalId = updated.id;
    } else {
      // 신규 레코드 생성
      const created = await prisma.tacticalMap.create({
        data: {
          userId: String(user_id),
          folderName: folder_name,
          title: title,
          visibility: visibility,
          data: savedData
        }
      });
      finalId = created.id;
    }

    res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });
`;

// I'll search for the entire block I added and replace it with this refined one.
// Actually, I'll just use a more surgical replace if I can.

fs.writeFileSync(path, content);
console.log('✅ Success: Central server data stringification fixed.');
