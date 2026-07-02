const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')

let mainWindow = null
let db = null

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'flowmind.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, name TEXT NOT NULL,
      notes TEXT DEFAULT '', duration_min INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, workout_id INTEGER NOT NULL, exercise TEXT NOT NULL,
      set_number INTEGER NOT NULL, reps INTEGER NOT NULL, weight_kg REAL DEFAULT 0, rpe REAL DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, weight_kg REAL, body_fat_pct REAL,
      chest_cm REAL, waist_cm REAL, arm_cm REAL, thigh_cm REAL, notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT 'custom',
      exercises_json TEXT DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT NOT NULL UNIQUE, phonetic TEXT DEFAULT '',
      definition TEXT DEFAULT '', example TEXT DEFAULT '', category TEXT DEFAULT 'general',
      proficiency INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, type TEXT DEFAULT 'vocabulary',
      duration_min INTEGER DEFAULT 0, words_learned INTEGER DEFAULT 0, notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS reading_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, source_url TEXT DEFAULT '',
      content TEXT DEFAULT '', new_words_json TEXT DEFAULT '[]', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, authors TEXT DEFAULT '',
      arxiv_id TEXT DEFAULT '', published_date TEXT DEFAULT '', abstract TEXT DEFAULT '',
      tags TEXT DEFAULT '', status TEXT DEFAULT 'to_read', notes TEXT DEFAULT '', pdf_path TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS research_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT DEFAULT '',
      tags TEXT DEFAULT '', related_papers_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT DEFAULT '', source TEXT DEFAULT '', category TEXT DEFAULT 'paper',
      importance INTEGER DEFAULT 3
    );
    CREATE TABLE IF NOT EXISTS tracked_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT DEFAULT '',
      description TEXT DEFAULT '', last_update TEXT DEFAULT '', status TEXT DEFAULT 'active'
    );
  `)
}

// IPC: query
ipcMain.handle('db:query', (_e, sql, params) => {
  try {
    const stmt = db.prepare(sql)
    return { success: true, data: params ? stmt.all(...params) : stmt.all() }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// IPC: run
ipcMain.handle('db:run', (_e, sql, params) => {
  try {
    const stmt = db.prepare(sql)
    const result = params ? stmt.run(...params) : stmt.run()
    return { success: true, lastInsertRowid: result.lastInsertRowid, changes: result.changes }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'FlowMind',
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  if (db) db.close()
})
