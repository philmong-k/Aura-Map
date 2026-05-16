const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. POST /api/tactical-map 핸들러를 ID 매칭 우선 방식으로 개편
const targetPostStart = "app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {";
const targetPostEnd = "res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });";

const replacementHandlerBody = `
  const { id: clientId, nodes, edges, snapshots = [], folder_name = 'Unclassified', title = 'Untitled Tactical Map', visibility = 'PRIVATE' } = req.body;
  const user_id = req.user?.email || 'guest';

  if (!nodes || !edges) {
    return res.status(400).json({ error: '유효하지 않은 데이터 형식입니다.' });
  }

  try {
    const jsonString = JSON.stringify({ nodes, edges, snapshots });
    let existing;

    // 🛡️ [v4.7.3] 1순위: ID 기반 매칭 (클라이언트가 UUID를 보냈을 경우)
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    if (clientId && isUUID(clientId)) {
      existing = await prisma.tacticalMap.findUnique({ where: { id: clientId } });
    }

    // 🛡️ [v4.7.3] 2순위: 제목 + 폴더 기반 매칭 (신규 생성 시 또는 임시 ID일 경우)
    if (!existing) {
      existing = await prisma.tacticalMap.findFirst({
        where: { 
          userId: String(user_id),
          folderName: folder_name,
          title: title
        }
      });
    }

    let finalId;
    if (existing) {
      // 기존 레코드 업데이트
      const updated = await prisma.tacticalMap.update({
        where: { id: existing.id },
        data: { data: jsonString, visibility, title, folderName: folder_name, updatedAt: new Date() }
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

    res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });
`;

// Surgical replacement of the body
const startIdx = content.indexOf(targetPostStart);
const endIdx = content.indexOf(targetPostEnd) + targetPostEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx + targetPostStart.length);
    const after = content.substring(endIdx);
    content = before + replacementHandlerBody + after;
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server POST handler upgraded to ID-First logic.');
} else {
    console.log('❌ Error: Could not find POST handler blocks.');
}
