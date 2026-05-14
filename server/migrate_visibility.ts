import pool from './db';

async function migrate() {
  try {
    console.log('Starting DB migration...');
    
    // Check if column exists
    const [columns]: any = await pool.query('SHOW COLUMNS FROM tactical_maps LIKE "visibility"');
    
    if (columns.length === 0) {
      await pool.query('ALTER TABLE tactical_maps ADD COLUMN visibility VARCHAR(20) DEFAULT "PRIVATE" AFTER title');
      console.log('Column "visibility" added to tactical_maps');
    } else {
      console.log('Column "visibility" already exists');
    }

    // Update user_id index if needed or just add ownerId alias check
    // The user said ownerId (String), but we already have user_id. 
    // I will stick with user_id for now as it maps to ownerId logic.

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
