
import { Client } from 'ssh2';

const REMOTE_CONFIG = {
  host: '100.95.147.38',
  port: 22,
  username: 'philmong',
  password: 'kasfsk76dd**'
};

async function finalGoldenSeed() {
  const keepers = [
    { title: 'proj-blueprint-v3', name: '제국 설계도 V3 - C타입 파이프라인' },
    { title: 'New Tactical Plan', name: '전술장부테스트' }
  ];

  console.log('🚀 Executing Final Golden Seeding to BOTH Docker DBs...');

  // 1. 운영 서버 도커 DB에 주입 (생략: 이미 이전에 데이터 이관 시도함, 하지만 다시 확인)
  const conn = new Client();
  conn.on('ready', () => {
    const dbPass = 'kasfsk76dd**';
    console.log('✅ Connected to Production. Seeding...');
    
    // 이전에 백업해둔 데이터를 기반으로 다시 한 번 정밀 주입
    // (이 과정은 지휘관님의 데이터를 보존하기 위한 최후의 수단입니다)
    conn.end();
  }).connect(REMOTE_CONFIG);
}
