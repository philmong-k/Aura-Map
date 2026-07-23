import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server 폴더 내부 및 상위 루트 폴더 모두의 .env를 하이브리드로 완벽 탐색
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 10,
  // agent_canvas 스키마를 기본 검색 경로에 두어 매 쿼리마다 스키마를 명시하지 않아도 되게 함
  options: '-c search_path=agent_canvas,public',
});

// 연결 테스트
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Postgres (Supabase Self-hosted) Connected Successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Postgres Connection Failed:', error);
    console.log(`💡 TIP: .env 파일의 DB_PASSWORD가 올바른지, DB 서버(${process.env.DB_HOST}:${process.env.DB_PORT})에 접근 가능한지 확인하세요.`);
  }
})();

export default pool;
