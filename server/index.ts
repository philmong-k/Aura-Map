import express from 'express';
import cors from 'cors';
import pool from './db';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🛡️ JWT 인증 미들웨어 (Aura SSO 연동)
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: '인증 토큰이 누락되었습니다.' });

  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded) return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    
    req.user = decoded; // { email, role, permissions }
    next();
  } catch (err) {
    return res.status(403).json({ error: '토큰 해석 중 오류가 발생했습니다.' });
  }
};

// 🏠 루트 경로
app.get('/', (req, res) => {
  res.send('🚀 NEURAL BACKEND Server is running and hungry for tactical data!');
});

// 🛰️ GET /api/tactical-map
app.get('/api/tactical-map', async (req, res) => {
  const { user_id = 'guest' } = req.query;
  try {
    const [rows]: any = await pool.query(
      `SELECT id, user_id, folder_name, title, visibility, data, updated_at 
       FROM tactical_maps 
       WHERE user_id = ? OR visibility = 'SHARED' 
       ORDER BY folder_name ASC, updated_at DESC`,
      [user_id]
    );
    const maps = rows.map((row: any) => ({
      ...JSON.parse(row.data),
      id: row.id,
      user_id: row.user_id,
      folder_name: row.folder_name,
      title: row.title,
      visibility: row.visibility,
      updated_at: row.updated_at
    }));
    res.json(maps);
  } catch (error) {
    console.error('Fetch Map Error:', error);
    res.status(500).json({ error: '데이터 조회 중 오류 발생' });
  }
});

// 📡 POST /api/tactical-map
app.post('/api/tactical-map', async (req, res) => {
  const { 
    nodes, edges, snapshots = [], user_id = 'guest', 
    folder_name = 'Unclassified', title = 'Untitled Tactical Map',
    visibility = 'PRIVATE' 
  } = req.body;

  if (!nodes || !edges) return res.status(400).json({ error: '데이터 부족' });

  try {
    const dataString = JSON.stringify({ nodes, edges, snapshots });
    const [existing]: any = await pool.query(
      'SELECT id FROM tactical_maps WHERE user_id = ? AND folder_name = ? AND title = ? LIMIT 1',
      [user_id, folder_name, title]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE tactical_maps SET data = ?, visibility = ?, updated_at = NOW() WHERE id = ?',
        [dataString, visibility, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO tactical_maps (user_id, folder_name, title, visibility, data) VALUES (?, ?, ?, ?, ?)',
        [user_id, folder_name, title, visibility, dataString]
      );
    }
    res.json({ message: '✅ 저장 완료', user_id, folder_name, title, visibility });
  } catch (error) {
    console.error('Save Error:', error);
    res.status(500).json({ error: '저장 실패' });
  }
});

// 📂 PATCH /api/tactical-map/folder
app.patch('/api/tactical-map/folder', async (req, res) => {
  const { oldName, newName, user_id = 'guest' } = req.body;
  try {
    await pool.query('UPDATE tactical_maps SET folder_name = ? WHERE folder_name = ? AND user_id = ?', [newName, oldName, user_id]);
    res.json({ message: '✅ 폴더 이동 완료' });
  } catch (error) {
    res.status(500).json({ error: '폴더 변경 실패' });
  }
});

// 📂 DELETE /api/tactical-map/folder/:name
app.delete('/api/tactical-map/folder/:name', async (req, res) => {
  const { name } = req.params;
  const { user_id = 'guest' } = req.query;
  try {
    await pool.query('DELETE FROM tactical_maps WHERE folder_name = ? AND user_id = ?', [name, user_id]);
    res.json({ message: '🔥 폴더 삭제 완료' });
  } catch (error) {
    res.status(500).json({ error: '폴더 삭제 실패' });
  }
});

// 🛰️ PATCH /api/tactical-map/:id (이중 보안 고도화)
app.patch('/api/tactical-map/:id', authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const { folder_name, title, visibility } = req.body;
  const user = req.user;

  try {
    // 1. 소유권 확인
    const [docs]: any = await pool.query('SELECT user_id FROM tactical_maps WHERE id = ?', [id]);
    if (docs.length === 0) return res.status(404).json({ error: '해당 데이터를 찾을 수 없습니다.' });
    
    const doc = docs[0];
    const isOwner = doc.user_id === user.email;
    const isAdmin = user.role === 'admin';
    const hasEditPermission = user.permissions?.includes('plan:edit');

    if (!hasEditPermission) return res.status(403).json({ error: '전술 편집 권한이 없습니다.' });
    if (!isOwner && !isAdmin) return res.status(403).json({ error: '타인의 데이터를 수정할 수 없습니다.' });

    // 2. 필드 구성
    const fields: string[] = [];
    const params: any[] = [];

    if (folder_name !== undefined) { fields.push('folder_name = ?'); params.push(folder_name); }
    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (visibility !== undefined) { fields.push('visibility = ?'); params.push(visibility); }

    if (fields.length === 0) {
      // 바디가 비어있는 경우를 대비해 상세 로그 출력
      console.warn('[Security] Empty PATCH request body for id:', id, 'Body:', req.body);
      return res.status(400).json({ error: '[v4] 수정할 데이터가 없습니다. (Empty Body)', received: req.body });
    }

    params.push(id);
    await pool.query(`UPDATE tactical_maps SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, params);

    res.json({ message: '✅ 업데이트 완료', id, visibility });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: '업데이트 중 서버 오류 발생' });
  }
});

// 🗑️ DELETE /api/tactical-map/:id
app.delete('/api/tactical-map/:id', authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const [docs]: any = await pool.query('SELECT user_id FROM tactical_maps WHERE id = ?', [id]);
    if (docs.length === 0) return res.status(404).json({ error: '데이터 부족' });
    const isOwner = docs[0].user_id === user.email;
    const isAdmin = user.role === 'admin';
    const hasDeletePermission = user.permissions?.includes('plan:delete');

    if (!hasDeletePermission) return res.status(403).json({ error: '삭제 권한 부족' });
    if (!isOwner && !isAdmin) return res.status(403).json({ error: '타인 데이터 삭제 불가' });

    await pool.query('DELETE FROM tactical_maps WHERE id = ?', [id]);
    res.json({ message: '✅ 삭제 완료' });
  } catch (error) {
    res.status(500).json({ error: '삭제 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NEURAL BACKEND Server running on http://localhost:${PORT}`);
});
