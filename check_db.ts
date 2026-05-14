import pool from './server/db';

async function checkSchema() {
  try {
    const [rows] = await pool.query('DESCRIBE tactical_maps');
    console.log("tactical_maps schema:", rows);
    
    const [data] = await pool.query('SELECT id, visibility FROM tactical_maps LIMIT 5');
    console.log("Sample data:", data);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
