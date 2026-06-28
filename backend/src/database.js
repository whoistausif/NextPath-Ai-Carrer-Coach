import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;
const isPg = !!databaseUrl;

let pgPool = null;
let sqliteDb = null;

if (isPg) {
  pgPool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Render/Neon PostgreSQL cloud connections
  });
  console.log('Connected to the PostgreSQL cloud database.');
} else {
  const dbDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'coach.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
}

function translateSql(sql) {
  if (!isPg) return sql;
  
  // Convert SQLite syntax to PostgreSQL syntax
  let parsed = sql;
  parsed = parsed.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  parsed = parsed.replace(/DATETIME/gi, 'TIMESTAMP');
  
  // Replace "?" parameter placeholders with PG "$1, $2" syntax
  let index = 1;
  parsed = parsed.replace(/\?/g, () => `$${index++}`);
  
  return parsed;
}

export const dbRun = (sql, params = []) => {
  const parsedSql = translateSql(sql);
  if (isPg) {
    return new Promise((resolve, reject) => {
      // In PostgreSQL, to get the last inserted ID, we append RETURNING id
      let querySql = parsedSql;
      if (querySql.trim().toUpperCase().startsWith('INSERT ')) {
        querySql += ' RETURNING id';
      }
      pgPool.query(querySql, params, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const insertedRow = res.rows && res.rows[0];
          resolve({ id: insertedRow ? insertedRow.id : null, changes: res.rowCount });
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(parsedSql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

export const dbGet = (sql, params = []) => {
  const parsedSql = translateSql(sql);
  if (isPg) {
    return new Promise((resolve, reject) => {
      pgPool.query(parsedSql, params, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.rows && res.rows[0]);
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(parsedSql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};

export const dbAll = (sql, params = []) => {
  const parsedSql = translateSql(sql);
  if (isPg) {
    return new Promise((resolve, reject) => {
      pgPool.query(parsedSql, params, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.rows || []);
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(parsedSql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
};

export const initDatabase = async () => {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        target_role TEXT,
        experience_level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        parsed_text TEXT,
        analysis_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS roadmaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        level TEXT NOT NULL,
        roadmap_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        dialogue_json TEXT NOT NULL,
        score INTEGER,
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS learning_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_json TEXT NOT NULL,
        completed_tasks TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS saved_salaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        location TEXT NOT NULL,
        salary_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sender TEXT CHECK(sender IN ('user', 'ai')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

export default pgPool || sqliteDb;
