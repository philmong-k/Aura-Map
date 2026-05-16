const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// TacticalMap 모델에 version 필드 추가
const targetModel = "model TacticalMap {";
const replacementModel = "model TacticalMap {\n  version    Int                @default(1)";

if (content.includes(targetModel) && !content.includes("version    Int")) {
    content = content.replace(targetModel, replacementModel);
    fs.writeFileSync(path, content);
    console.log('✅ Success: Prisma schema updated with version field.');
} else {
    console.log('⚠️ Warning: version field already exists or model not found.');
}
