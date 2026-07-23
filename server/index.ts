import express from 'express';
import cors from 'cors';
import pool from './db';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// .env에 없으면 프로세스마다 무작위 시크릿을 생성 — 재시작 시 기존 토큰은 무효화되지만
// 소스에 박제된 추측 가능한 문자열로 서명하는 것보다 안전함
const AURA_SECRET = process.env.AURA_JWT_SECRET || require('crypto').randomBytes(48).toString('hex');
if (!process.env.AURA_JWT_SECRET) {
  console.warn('⚠️ AURA_JWT_SECRET이 .env에 설정되지 않아 임시 시크릿을 생성했습니다. 서버 재시작 시 기존 토큰이 모두 무효화됩니다.');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🛡️ [v4.7.0-PLATINUM] Aura Standard 인증 수문장 (Standard Auth Engine)
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const TACTICAL_API_KEY = process.env.VITE_TACTICAL_API_KEY || 'aura-tactical-default-key';

  if (!token) return res.status(401).json({ error: '인증 토큰이 누락되었습니다.' });

  // 1. 만능키(Master Key) 또는 시스템 API 키 인증 (지휘관 전용 특권)
  if (token === TACTICAL_API_KEY || token === 'commander') {
    req.user = { sub: 'Commander_Slo', role: 'admin', permissions: ['plan:edit', 'plan:delete'] };
    console.log('👑 [Auth] 지휘관 마스터 키(Universal Key) 인증 성공');
    return next();
  }

  // 2. JWT 서명 검증 (정식 지휘권 확인)
  try {
    const decoded = jwt.verify(token, AURA_SECRET) as any;
    req.user = decoded;
    console.log(`👤 [Auth] 사용자 인증 성공: ${decoded.sub} (${decoded.role})`);
    next();
  } catch (err) {
    console.warn('🚨 [Auth Fail] 위조되거나 만료된 통행증 감지!');
    return res.status(403).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
  }
};

// 🔐 [v4.7.0-PLATINUM] 자체 로그인 라우트 (agent_canvas 전용 users 테이블 조회, Supabase Auth와는 분리)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const MASTER_KEY = 'commander';

  // [Case 1] 지휘관 만능키(Master Key) - 즉시 승인 및 Admin 권한 부여
  if (password === MASTER_KEY) {
    const token = jwt.sign(
      { sub: username || 'commander', role: 'ADMIN', permissions: ['plan:edit', 'plan:delete', 'access:canvas'] },
      AURA_SECRET,
      { expiresIn: '365d' }
    );
    console.log(`👑 [Auth] 지휘관 마스터 키 로그인 성공: ${username || 'commander'}`);
    return res.json({ token, role: 'ADMIN', message: '환영합니다. 로그인되었습니다.' });
  }

  // [Case 2] agent_canvas 전용 users 테이블 대조
  try {
    const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [username]);
    if (users.length === 0) return res.status(401).json({ error: '등록되지 않은 계정입니다.' });

    const user = users[0];

    // 🛡️ Bcrypt를 통한 표준 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      const token = jwt.sign(
        { sub: user.email, role: user.role, permissions: ['plan:view', 'access:canvas'] },
        AURA_SECRET,
        { expiresIn: '24h' }
      );
      console.log(`👤 [Auth] 정식 대원 로그인 성공: ${username}`);
      return res.json({ token, role: user.role, message: `${user.name || username}님, 환영합니다.` });
    } else {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: '계정 조회 중 오류 발생' });
  }
});

// 🏠 루트 경로
app.get('/', (req, res) => {
  res.send('🚀 NEURAL BACKEND Server is running and hungry for tactical data!');
});

// 🛰️ GET /api/tactical-map (보안 강화)
app.get('/api/tactical-map', authMiddleware, async (req: any, res) => {
  const user = req.user;
  const user_id = user.sub || user.email || 'guest';
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, folder_name, title, visibility, data, updated_at
       FROM tactical_maps
       WHERE user_id = $1 OR visibility = 'SHARED'
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

// 📡 POST /api/tactical-map (저장 권한 검증)
app.post('/api/tactical-map', authMiddleware, async (req: any, res) => {
  const user = req.user;
  const {
    nodes, edges, snapshots = [], user_id = user.sub || user.email || 'guest',
    folder_name = 'Unclassified', title = 'Untitled Tactical Map',
    visibility = 'PRIVATE'
  } = req.body;

  if (!nodes || !edges) return res.status(400).json({ error: '데이터 부족' });

  try {
    const dataString = JSON.stringify({ nodes, edges, snapshots });
    const { rows: existing } = await pool.query(
      'SELECT id FROM tactical_maps WHERE user_id = $1 AND folder_name = $2 AND title = $3 LIMIT 1',
      [user_id, folder_name, title]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE tactical_maps SET data = $1, visibility = $2 WHERE id = $3',
        [dataString, visibility, existing[0].id]
      );
      res.json({ message: '✅ 저장 완료', id: existing[0].id, user_id, folder_name, title, visibility });
    } else {
      const { rows: result } = await pool.query(
        'INSERT INTO tactical_maps (user_id, folder_name, title, visibility, data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user_id, folder_name, title, visibility, dataString]
      );
      res.json({ message: '✅ 저장 완료', id: result[0].id, user_id, folder_name, title, visibility });
    }
  } catch (error) {
    console.error('Save Error:', error);
    res.status(500).json({ error: '저장 실패' });
  }
});

// 📂 PATCH /api/tactical-map/folder (관리 권한 검증)
app.patch('/api/tactical-map/folder', authMiddleware, async (req: any, res) => {
  const user = req.user;
  const { oldName, newName, user_id = user.sub || user.email || 'guest' } = req.body;
  try {
    await pool.query('UPDATE tactical_maps SET folder_name = $1 WHERE folder_name = $2 AND user_id = $3', [newName, oldName, user_id]);
    res.json({ message: '✅ 폴더 이동 완료' });
  } catch (error) {
    res.status(500).json({ error: '폴더 변경 실패' });
  }
});

// 📂 DELETE /api/tactical-map/folder/:name (삭제 권한 검증)
app.delete('/api/tactical-map/folder/:name', authMiddleware, async (req: any, res) => {
  const user = req.user;
  const { name } = req.params;
  const user_id = user.sub || user.email || 'guest';
  try {
    await pool.query('DELETE FROM tactical_maps WHERE folder_name = $1 AND user_id = $2', [name, user_id]);
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
    const { rows: docs } = await pool.query('SELECT user_id FROM tactical_maps WHERE id = $1', [id]);
    if (docs.length === 0) return res.status(404).json({ error: '해당 데이터를 찾을 수 없습니다.' });

    const doc = docs[0];
    const isOwner = doc.user_id === user.email;
    const isAdmin = user.role === 'admin';
    const hasEditPermission = user.permissions?.includes('plan:edit');

    if (!hasEditPermission) return res.status(403).json({ error: '편집 권한이 없습니다.' });
    if (!isOwner && !isAdmin) return res.status(403).json({ error: '타인의 데이터를 수정할 수 없습니다.' });

    // 2. 필드 구성
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (folder_name !== undefined) { fields.push(`folder_name = $${idx++}`); params.push(folder_name); }
    if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title); }
    if (visibility !== undefined) { fields.push(`visibility = $${idx++}`); params.push(visibility); }

    if (fields.length === 0) {
      // 바디가 비어있는 경우를 대비해 상세 로그 출력
      console.warn('[Security] Empty PATCH request body for id:', id, 'Body:', req.body);
      return res.status(400).json({ error: '[v4] 수정할 데이터가 없습니다. (Empty Body)', received: req.body });
    }

    params.push(id);
    await pool.query(`UPDATE tactical_maps SET ${fields.join(', ')} WHERE id = $${idx}`, params);

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
    const { rows: docs } = await pool.query('SELECT user_id FROM tactical_maps WHERE id = $1', [id]);
    if (docs.length === 0) return res.status(404).json({ error: '데이터 부족' });
    const isOwner = docs[0].user_id === user.email;
    const isAdmin = user.role === 'admin';
    const hasDeletePermission = user.permissions?.includes('plan:delete');

    if (!hasDeletePermission) return res.status(403).json({ error: '삭제 권한 부족' });
    if (!isOwner && !isAdmin) return res.status(403).json({ error: '타인 데이터 삭제 불가' });

    await pool.query('DELETE FROM tactical_maps WHERE id = $1', [id]);
    res.json({ message: '✅ 삭제 완료' });
  } catch (error) {
    res.status(500).json({ error: '삭제 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NEURAL BACKEND Server running on http://localhost:${PORT}`);
});
