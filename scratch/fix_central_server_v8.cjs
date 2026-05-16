const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. POST /api/tactical-map 핸들러에 임시 ID 예외 로직 및 데이터 타입 강제화 도입
const targetPostStart = "app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {";
const targetPostEnd = "const finalRecord = await prisma.tacticalMap.findUnique({ where: { id: finalId } }); res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility, updated_at: finalRecord?.updatedAt });";

const replacementHandlerBody = `
  const { id: clientId, server_updated_at, nodes, edges, snapshots = [], folder_name = 'Unclassified', title = 'Untitled Tactical Map', visibility = 'PRIVATE' } = req.body;
  const user_id = req.user?.email || 'guest';

  if (!nodes || !edges) {
    return res.status(400).json({ error: '유효하지 않은 데이터 형식입니다.' });
  }

  try {
    // 🛡️ [v4.7.7] 데이터 타입 강제 String화 (Prisma LongText 정합성)
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
      // 🛡️ [v4.7.7] 신규 프로젝트(임시 ID) 예외 처리
      const isTempProject = clientId && String(clientId).startsWith('proj-');
      const dbTime = new Date(existing.updatedAt).getTime();
      const clientKnownTime = server_updated_at ? new Date(server_updated_at).getTime() : 0;

      // 임시 ID이거나, 클라이언트 시간이 서버 시간과 일치/미래일 경우에만 메타데이터 업데이트
      const shouldUpdateMetadata = isTempProject || (clientKnownTime >= dbTime - 1000);

      const updateData: any = { 
        data: jsonString, 
        visibility, 
        updatedAt: new Date() 
      };

      if (shouldUpdateMetadata) {
        updateData.title = String(title);
        updateData.folderName = String(folder_name);
        console.log(\`✅ [\${existing.id}] 업데이트 승인 (임시ID 여부: \${isTempProject})\`);
      } else {
        console.warn(\`⚠️ [\${existing.id}] 제목 보호 모드: 클라이언트 시간(\${new Date(clientKnownTime).toISOString()})이 서버(\${existing.updatedAt.toISOString()})보다 낡음.\`);
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
          folderName: String(folder_name),
          title: String(title),
          visibility: String(visibility),
          data: jsonString
        }
      });
      finalId = created.id;
    }

    const finalRecord = await prisma.tacticalMap.findUnique({ where: { id: finalId } });
    res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility, updated_at: finalRecord?.updatedAt });
`;

const startIdx = content.indexOf(targetPostStart);
const endIdx = content.indexOf(targetPostEnd) + targetPostEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx + targetPostStart.length);
    const after = content.substring(endIdx);
    content = before + replacementHandlerBody + after;
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server upgraded to v4.7.7 with Temp-ID bypass.');
} else {
    console.log('❌ Error: Could not find POST handler blocks.');
}
