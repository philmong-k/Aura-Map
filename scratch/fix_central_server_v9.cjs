const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. POST /api/tactical-map 핸들러에 버전(version) 기반 제어 도입
const targetPostStart = "app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {";
const targetPostEnd = "const finalRecord = await prisma.tacticalMap.findUnique({ where: { id: finalId } }); res.json({ message: '✅ 전술 데이터 저장 완료', id: finalId, user_id, folder_name, title, visibility, updated_at: finalRecord?.updatedAt });";

const replacementHandlerBody = `
  const { id: clientId, version: clientVersion, server_updated_at, nodes, edges, snapshots = [], folder_name = 'Unclassified', title = 'Untitled Tactical Map', visibility = 'PRIVATE' } = req.body;
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
    let finalVersion = 1;
    if (existing) {
      // 🛡️ [v4.7.9] 버전 기반 낙관적 동시성 제어 (OCC)
      const dbVersion = existing.version || 1;
      const cv = clientVersion ? Number(clientVersion) : 0;
      
      // 클라이언트 버전이 서버보다 낮으면 '충돌'로 간주하지만, 
      // 사용자 편의를 위해 데이터는 업데이트하되 제목 보호 및 버전 강제 동기화 수행
      const isStale = cv < dbVersion;
      
      const updateData: any = { 
        data: jsonString, 
        visibility, 
        updatedAt: new Date(),
        version: dbVersion + 1 // 버전 상시 증가
      };

      // 제목 업데이트는 버전이 일치하거나 신규(0)일 때만 허용
      if (!isStale || cv === 0) {
        updateData.title = String(title);
        updateData.folderName = String(folder_name);
      }

      const updated = await prisma.tacticalMap.update({
        where: { id: existing.id },
        data: updateData
      });
      finalId = updated.id;
      finalVersion = updated.version;
    } else {
      const created = await prisma.tacticalMap.create({
        data: {
          userId: String(user_id),
          folderName: String(folder_name),
          title: String(title),
          visibility: String(visibility),
          data: jsonString,
          version: 1
        }
      });
      finalId = created.id;
      finalVersion = created.version;
    }

    const finalRecord = await prisma.tacticalMap.findUnique({ where: { id: finalId } });
    res.json({ 
      message: '✅ 전술 데이터 저장 완료', 
      id: finalId, 
      version: finalVersion,
      user_id, 
      folder_name: finalRecord?.folderName, 
      title: finalRecord?.title, 
      visibility: finalRecord?.visibility, 
      updated_at: finalRecord?.updatedAt 
    });
`;

const startIdx = content.indexOf(targetPostStart);
const endIdx = content.indexOf(targetPostEnd) + targetPostEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx + targetPostStart.length);
    const after = content.substring(endIdx);
    content = before + replacementHandlerBody + after;
    fs.writeFileSync(path, content);
    console.log('✅ Success: Central server upgraded to v4.7.9 OCC Engine.');
} else {
    console.log('❌ Error: Could not find POST handler blocks.');
}
