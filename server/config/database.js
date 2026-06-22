const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'blueprint_viewer.db');
const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    avatar TEXT DEFAULT '',
    authProvider TEXT DEFAULT 'local',
    authProviderId TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    isVerified INTEGER DEFAULT 0,
    refreshToken TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    layers TEXT DEFAULT '{}',
    dimensions TEXT DEFAULT '[]',
    sharing TEXT DEFAULT '{}',
    userId TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS blueprints (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    fileUrl TEXT NOT NULL,
    fileType TEXT NOT NULL,
    layer TEXT DEFAULT 'structural',
    originalName TEXT,
    fileSize INTEGER DEFAULT 0,
    extractedData TEXT DEFAULT '{}',
    metadata TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    userId TEXT NOT NULL,
    position TEXT NOT NULL DEFAULT '{}',
    content TEXT NOT NULL,
    type TEXT DEFAULT 'note',
    color TEXT DEFAULT '#ff6b35',
    isResolved INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL UNIQUE,
    walls TEXT DEFAULT '{}',
    floors TEXT DEFAULT '{}',
    ceiling TEXT DEFAULT '{}',
    furniture TEXT DEFAULT '{}',
    lighting TEXT DEFAULT '{}',
    theme TEXT DEFAULT 'light',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    ip TEXT DEFAULT '',
    userAgent TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);
  CREATE INDEX IF NOT EXISTS idx_blueprints_projectId ON blueprints(projectId);
  CREATE INDEX IF NOT EXISTS idx_annotations_projectId ON annotations(projectId);
  CREATE INDEX IF NOT EXISTS idx_materials_projectId ON materials(projectId);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_userId ON activity_logs(userId);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_createdAt ON activity_logs(createdAt);
`);

// Migrations: add missing columns to existing tables
const migrations = [
  { table: 'blueprints', column: 'layer', def: 'TEXT DEFAULT \'structural\'' },
];

for (const m of migrations) {
  const cols = db.prepare(`PRAGMA table_info(${m.table})`).all();
  const hasColumn = cols.some(c => c.name === m.column);
  if (!hasColumn) {
    try {
      db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.def}`);
      console.log(`Migrated: added ${m.column} to ${m.table}`);
    } catch (e) {
      console.warn(`Migration warning: ${e.message}`);
    }
  }
}

module.exports = db;
