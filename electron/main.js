const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWindow = null
let db = null

function initDatabase() {
  try {
    const Database = require('better-sqlite3')
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
        chest_cm REAL, waist_cm REAL, arm_cm REAL, thigh_cm REAL, hip_cm REAL, calf_cm REAL,
        photo TEXT DEFAULT '', notes TEXT DEFAULT ''
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
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, mood TEXT DEFAULT 'good',
        title TEXT DEFAULT '', content TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS reading_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, source_url TEXT DEFAULT '',
        type TEXT DEFAULT 'article', status TEXT DEFAULT 'reading', progress INTEGER DEFAULT 0,
        notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
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
        description TEXT DEFAULT '', last_update TEXT DEFAULT '', status TEXT DEFAULT 'watching'
      );
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
        description TEXT DEFAULT '', due_date TEXT DEFAULT '',
        priority TEXT DEFAULT 'medium', completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS spending_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        color TEXT DEFAULT '#4c6ef5', icon TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS spending_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL,
        category_id INTEGER NOT NULL, amount REAL NOT NULL,
        description TEXT DEFAULT '', is_necessary INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES spending_categories(id) ON DELETE CASCADE
      );
    `)

    // 迁移：给 body_metrics 加新字段（兼容旧数据库）
    const cols = db.prepare("PRAGMA table_info(body_metrics)").all().map((c) => c.name)
    if (!cols.includes('hip_cm')) db.exec('ALTER TABLE body_metrics ADD COLUMN hip_cm REAL')
    if (!cols.includes('calf_cm')) db.exec('ALTER TABLE body_metrics ADD COLUMN calf_cm REAL')
    if (!cols.includes('photo')) db.exec("ALTER TABLE body_metrics ADD COLUMN photo TEXT DEFAULT ''")

    // 迁移：给 tracked_projects 加投资相关字段
    const pcols = db.prepare("PRAGMA table_info(tracked_projects)").all().map((c) => c.name)
    if (!pcols.includes('ticker')) db.exec('ALTER TABLE tracked_projects ADD COLUMN ticker TEXT DEFAULT \'\'')
    if (!pcols.includes('price')) db.exec('ALTER TABLE tracked_projects ADD COLUMN price REAL')
    if (!pcols.includes('position')) db.exec("ALTER TABLE tracked_projects ADD COLUMN position TEXT DEFAULT ''")

    // 投资观点表
    db.exec(`
      CREATE TABLE IF NOT EXISTS investment_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        date TEXT NOT NULL,
        view TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        my_take TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)

    // 持仓表
    db.exec(`
      CREATE TABLE IF NOT EXISTS investment_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        ticker TEXT DEFAULT '',
        price REAL,
        quantity REAL,
        dividend REAL,
        target_price REAL,
        reason TEXT DEFAULT '',
        status TEXT DEFAULT 'holding',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)

    // 投资理念表
    db.exec(`
      CREATE TABLE IF NOT EXISTS investment_philosophies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)

    console.log('[FlowMind] Database initialized successfully')
  } catch (err) {
    console.error('[FlowMind] Database init failed:', err.message)
    console.error('[FlowMind] App will run without database. Run "yarn rebuild" to fix.')
  }
}

// IPC: query
ipcMain.handle('db:query', (_e, sql, params) => {
  if (!db) return { success: false, error: 'Database not available' }
  try {
    const stmt = db.prepare(sql)
    return { success: true, data: params ? stmt.all(...params) : stmt.all() }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// IPC: run
ipcMain.handle('db:run', (_e, sql, params) => {
  if (!db) return { success: false, error: 'Database not available' }
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
    console.log('[FlowMind] Dev mode: loading http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    console.log('[FlowMind] Production mode: loading dist/index.html')
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('[FlowMind] Load failed:', code, desc)
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  console.log('[FlowMind] App ready, initializing...')
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
  if (db) { try { db.close() } catch {} }
})
