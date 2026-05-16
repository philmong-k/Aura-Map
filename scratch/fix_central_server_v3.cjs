const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

const targetBlock = `    if (existing) {
      // 기존 레코드 업데이트
      await prisma.tacticalMap.update({
        where: { id: existing.id },
        data: { data: data as any, visibility, updatedAt: new Date() }
      });
    } else {
      // 신규 레코드 생성
      await prisma.tacticalMap.create({
        data: {
          userId: String(user_id),
          folderName: folder_name,
          title: title,
          visibility: visibility,
          data: data as any
        }
      });
    }

    
    const savedMap = existing || await prisma.tacticalMap.findFirst({
      where: { userId: String(user_id), folderName: folder_name, title: title }
    });
    res.json({ message: '✅ 전술 데이터 저장 완료', id: savedMap?.id, user_id, folder_name, title, visibility });`;

const replacementBlock = `    let finalId;
    const jsonString = JSON.stringify(data);

    if (existing) {
      // 기존 레코드 업데이트
      const updated = await prisma.tacticalMap.update({
        where: { id: existing.id },
        data: { data: jsonString, visibility, updatedAt: new Date() }
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
          data: jsonString
        }
      });
      finalId = created.id;
    }

    res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });`;

if (content.includes(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    
    // Also fix any other 'data: data as any' if they exist in other routes (like UPDATE)
    content = content.replace(/data: data as any/g, "data: JSON.stringify(data)");
    
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server code fixed with JSON.stringify and optimized ID return.');
} else {
    console.log('❌ Error: Target block not found. Current file content might be different.');
    // Fallback: try simpler replace
    if (content.includes("data: data as any")) {
        console.log('Attempting fallback simple replace...');
        content = content.replace(/data: data as any/g, "data: JSON.stringify(data)");
        fs.writeFileSync(path, content);
        console.log('✅ Fallback success.');
    }
}
