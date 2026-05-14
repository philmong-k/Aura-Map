import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 연결 테스트
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MariaDB (Neural Network) Connected Successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ MariaDB Connection Failed:', error);
    console.log('💡 TIP: .env 파일의 DB_PASSWORD가 올바른지, 서버 IP(100.95.147.38)에 접근 가능한지 확인하세요.');
  }
})();

export default pool;
