-- Agent Canvas 전용 스키마 (Supabase/Postgres). 기존 상품/주문 등 비즈니스 테이블과 완전히 분리됨.
CREATE SCHEMA IF NOT EXISTS agent_canvas;

DROP TABLE IF EXISTS agent_canvas.tactical_maps;
CREATE TABLE agent_canvas.tactical_maps (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) DEFAULT 'guest',
  folder_name VARCHAR(100) DEFAULT 'Unclassified',
  title VARCHAR(255) DEFAULT 'Untitled Tactical Map',
  visibility VARCHAR(20) DEFAULT 'PRIVATE',
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tactical_maps_user_id ON agent_canvas.tactical_maps (user_id);
CREATE INDEX idx_tactical_maps_folder_name ON agent_canvas.tactical_maps (folder_name);

-- Postgres에는 MySQL의 "ON UPDATE CURRENT_TIMESTAMP"가 없어 트리거로 대체
CREATE OR REPLACE FUNCTION agent_canvas.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tactical_maps_updated_at
BEFORE UPDATE ON agent_canvas.tactical_maps
FOR EACH ROW EXECUTE FUNCTION agent_canvas.set_updated_at();

-- 👥 사용자 계정 테이블 (server/index.ts의 /api/auth/login이 실제로 조회하는 형태)
CREATE TABLE IF NOT EXISTS agent_canvas.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'Operator',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 지휘관 마스터키 로그인은 DB를 조회하지 않고 코드(authMiddleware)에 하드코딩되어 있으므로
-- 여기서는 시드 데이터를 넣지 않음. 정식 계정이 필요해지면 bcrypt 해시로 직접 추가할 것.
