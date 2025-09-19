import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let db: mysql.Pool | null = null;
let usingSQLite = false;

// Try to initialize MySQL, fallback to SQLite if it fails
async function initializeDB() {
  if (db) return db;
  
  try {
    console.log('Attempting to connect to MySQL/MariaDB...');
    db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'quiz_game',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    
    // Test the connection
    await db.execute('SELECT 1');
    console.log('✅ Successfully connected to MySQL/MariaDB database');
    return db;
  } catch (error) {
    console.log('❌ MySQL not available, falling back to SQLite...');
    console.log('MySQL Error:', error);
    usingSQLite = true;
    
    // Import SQLite dynamically
    const { query: sqliteQuery, initializeDatabase: initSQLite } = await import('./db-config-sqlite');
    await initSQLite();
    return null; // SQLite doesn't use a pool
  }
}

// Example helper function
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (usingSQLite) {
    const { query: sqliteQuery } = await import('./db-config-sqlite');
    return await sqliteQuery<T>(sql, params);
  }
  
  if (!db) {
    await initializeDB();
  }
  
  if (db) {
    const [rows] = await db.execute(sql, params);
    return rows as T[];
  }
  
  throw new Error('Database not initialized');
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    await initializeDB(); // Ensure DB is initialized first
    
    if (usingSQLite) {
      const { initializeDatabase: initSQLite } = await import('./db-config-sqlite');
      await initSQLite();
      return;
    }

    // Create questions table (MySQL)
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(255) NOT NULL,
        question_text TEXT NOT NULL,
        choice_a VARCHAR(255) NOT NULL,
        choice_b VARCHAR(255) NOT NULL,
        choice_c VARCHAR(255) NOT NULL,
        choice_d VARCHAR(255) NOT NULL,
        correct_choice ENUM('A','B','C','D') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create games table (MySQL)
    await query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_name VARCHAR(255),
        settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create game_results table (MySQL)
    await query(`
      CREATE TABLE IF NOT EXISTS game_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT,
        player_name VARCHAR(255),
        score INT,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      )
    `);

    console.log('MySQL database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
