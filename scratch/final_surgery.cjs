const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 🛡️ [Final Surgery] Tactical Map POST 핸들러 전체를 도려내고 완벽한 코드로 교체
const startMarker = "app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {";
const endMarker = "// 3. Rename Folder";

const cleanHandler = `app.post('/api/tactical-map', authenticateToken, async (req: AuthRequest, res: Response) => {
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
      const dbVersion = existing.version || 1;
      const cv = clientVersion ? Number(clientVersion) : 0;
      const isStale = cv < dbVersion;
      
      const updateData: any = { 
        data: jsonString, 
        visibility, 
        updatedAt: new Date(),
        version: dbVersion + 1 
      };

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
  } catch (error) {
    console.error('Save Map Error:', error);
    res.status(500).json({ error: '데이터 저장 중 내부 서버 오류가 발생했습니다.' });
  }
});

`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);
    fs.writeFileSync(path, before + cleanHandler + after);
    console.log('✅ Success: Tactical Map handler completely restored and cleaned.');
} else {
    console.log(`❌ Error: Could not find markers. startIdx=${startIdx}, endIdx=${endIdx}`);
}
