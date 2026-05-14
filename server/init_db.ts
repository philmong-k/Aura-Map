import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function initializeDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '3306'),
    multipleStatements: true, // 여러 쿼리 실행 허용
  });

  try {
    const sqlPath = path.join(process.cwd(), 'server', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📡 MariaDB 초기화 시작...');
    await pool.query(sql);
    console.log('✅ MariaDB 초기화 완료! (Database & Table Created)');
  } catch (error) {
    console.error('❌ MariaDB 초기화 실패:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
