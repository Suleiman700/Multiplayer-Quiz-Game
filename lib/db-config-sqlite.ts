import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'quiz_game.db'),
      driver: sqlite3.Database
    });
  }
  return db;
}

// Helper function compatible with MySQL version
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  
  if (sql.trim().toUpperCase().startsWith('SELECT')) {
    return await database.all(sql, params) as T[];
  } else {
    const result = await database.run(sql, params);
    return [{ insertId: result.lastID, affectedRows: result.changes }] as any;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    const database = await getDatabase();
    
    // Create questions table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category VARCHAR(255) NOT NULL,
        question_text TEXT NOT NULL,
        choice_a VARCHAR(255) NOT NULL,
        choice_b VARCHAR(255) NOT NULL,
        choice_c VARCHAR(255) NOT NULL,
        choice_d VARCHAR(255) NOT NULL,
        correct_choice TEXT CHECK(correct_choice IN ('A','B','C','D')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create games table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_name VARCHAR(255),
        settings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create game_results table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS game_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        player_name VARCHAR(255),
        score INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      )
    `);

    console.log('SQLite database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
}
