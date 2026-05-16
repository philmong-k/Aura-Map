const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. POST /api/tactical-map 핸들러에 서버 시간 기반 정밀 대조 로직 도입
const targetPostStart = "app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {";
const targetPostEnd = "res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility });";

const replacementHandlerBody = `
  const { id: clientId, server_updated_at, nodes, edges, snapshots = [], folder_name = 'Unclassified', title = 'Untitled Tactical Map', visibility = 'PRIVATE' } = req.body;
  const user_id = req.user?.email || 'guest';

  if (!nodes || !edges) {
    return res.status(400).json({ error: '유효하지 않은 데이터 형식입니다.' });
  }

  try {
    const jsonString = JSON.stringify({ nodes, edges, snapshots });
    let existing;

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
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
      // 🛡️ [v4.7.5] 서버 시간 기반 정밀 대조 (Server-time Locking)
      const dbTime = new Date(existing.updatedAt).getTime();
      const clientKnownTime = server_updated_at ? new Date(server_updated_at).getTime() : 0;

      // 중요: 클라이언트가 알고 있는 서버의 시간이 실제 DB 시간보다 과거라면 
      // 그 사이에 다른 기기(모바일 등)에서 업데이트가 발생한 것임.
      // 이 경우 메타데이터(제목, 폴더)는 서버의 최신 값을 그대로 유지함.
      const isStaleRequest = clientKnownTime < dbTime - 1000; // 1초 여유 허용

      const updateData: any = { 
        data: jsonString, 
        visibility, 
        updatedAt: new Date() 
      };

      if (!isStaleRequest) {
        updateData.title = title;
        updateData.folderName = folder_name;
        console.log(\`✅ [\${existing.id}] 최신 상태 확인: 제목(\${title}) 업데이트 승인.\`);
      } else {
        console.warn(\`⚠️ [\${existing.id}] 충돌 감지! 클라이언트 지식(\${new Date(clientKnownTime).toISOString()}) < 서버 기록(\${existing.updatedAt.toISOString()}). 제목(\${existing.title}) 보호 모드 가동.\`);
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

const startIdx = content.indexOf(targetPostStart);
const endIdx = content.indexOf(targetPostEnd) + targetPostEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx + targetPostStart.length);
    const after = content.substring(endIdx);
    content = before + replacementHandlerBody + after;
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server upgraded with v4.7.5 Server-time Locking.');
} else {
    console.log('❌ Error: Could not find POST handler blocks.');
}
