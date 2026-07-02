// 统一数据库访问层：Electron 走 IPC，浏览器走 localStorage
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export async function dbQuery(sql, params) {
  if (isElectron) {
    const r = await window.electronAPI.query(sql, params)
    if (r && r.success) return r.data || []
    console.error('[dbQuery]', r?.error)
    return []
  }
  // localStorage fallback: 简单实现，用 table 名做 key
  const table = sql.match(/FROM\s+(\w+)/i)?.[1]
  if (!table) return []
  return JSON.parse(localStorage.getItem('fm_' + table) || '[]')
}

export async function dbRun(sql, params) {
  if (isElectron) {
    const r = await window.electronAPI.run(sql, params)
    if (r && r.success) return { id: r.lastInsertRowid || 0, changes: r.changes || 0 }
    console.error('[dbRun]', r?.error)
    return { id: 0, changes: 0 }
  }
  return { id: 0, changes: 0 }
}
