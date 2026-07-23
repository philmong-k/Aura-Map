import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function initializeDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    await client.connect();
    const sqlPath = path.join(process.cwd(), 'server', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📡 Postgres(Supabase) 초기화 시작...');
    await client.query(sql);
    console.log('✅ Postgres 초기화 완료! (Schema & Table Created)');
  } catch (error) {
    console.error('❌ Postgres 초기화 실패:', error);
  } finally {
    await client.end();
  }
}

initializeDatabase();
