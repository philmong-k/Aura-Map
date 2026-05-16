const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. POST /api/tactical-map 핸들러에 시간 기반 충돌 방지 로직 도입
const targetPostStart = "app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {";
const targetPostEnd = "res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });";

const replacementHandlerBody = `
  const { id: clientId, last_modified, nodes, edges, snapshots = [], folder_name = 'Unclassified', title = 'Untitled Tactical Map', visibility = 'PRIVATE' } = req.body;
  const user_id = req.user?.email || 'guest';

  if (!nodes || !edges) {
    return res.status(400).json({ error: '유효하지 않은 데이터 형식입니다.' });
  }

  try {
    const jsonString = JSON.stringify({ nodes, edges, snapshots });
    let existing;

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    if (clientId && isUUID(clientId)) {
      existing = await prisma.tacticalMap.findUnique({ where: { id: clientId } });
    }

    if (!existing) {
      existing = await prisma.tacticalMap.findFirst({
        where: { userId: String(user_id), folderName: folder_name, title: title }
      });
    }

    let finalId;
    if (existing) {
      // 🛡️ [v4.7.4] 시간 기반 충돌 방지 (Conflict Shield)
      const serverTime = new Date(existing.updatedAt).getTime();
      const clientTime = last_modified ? new Date(last_modified).getTime() : 0;

      // 만약 서버의 데이터가 클라이언트의 지식보다 더 최신이라면 (다른 기기에서 수정됨)
      // 이름(title)과 폴더(folderName)는 업데이트하지 않고 보존함.
      const shouldUpdateMetadata = clientTime >= serverTime;

      const updateData: any = { 
        data: jsonString, 
        visibility, 
        updatedAt: new Date() 
      };

      if (shouldUpdateMetadata) {
        updateData.title = title;
        updateData.folderName = folder_name;
        console.log(\`✅ [\${existing.id}] 최신 데이터 승인 및 메타데이터 업데이트 완료.\`);
      } else {
        console.warn(\`⚠️ [\${existing.id}] 충돌 감지: 서버 데이터가 더 최신입니다. 메타데이터(제목 등) 보호 모드 가동.\`);
      }

      const updated = await prisma.tacticalMap.update({
        where: { id: existing.id },
        data: updateData
      });
      finalId = updated.id;
    } else {
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

// Surgical replacement
const startIdx = content.indexOf(targetPostStart);
const endIdx = content.indexOf(targetPostEnd) + targetPostEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx + targetPostStart.length);
    const after = content.substring(endIdx);
    content = before + replacementHandlerBody + after;
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server upgraded with Conflict Shield logic.');
} else {
    console.log('❌ Error: Could not find POST handler blocks for upgrade.');
}
