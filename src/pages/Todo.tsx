import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, CheckSquare, Check, Circle } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function Todo() {
  const [todos, setTodos] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')

  async function load() { setTodos(await dbQuery('SELECT * FROM todos ORDER BY completed ASC, due_date ASC, id DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this todo?')) return
    await dbRun('DELETE FROM todos WHERE id = ?', [id])
    load()
  }

  async function toggle(id: number, completed: number) {
    await dbRun('UPDATE todos SET completed = ? WHERE id = ?', [completed ? 0 : 1, id])
    load()
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const priorities: any = { high: { color: '#ef4444', label: 'High' }, medium: { color: '#f59e0b', label: 'Medium' }, low: { color: '#22c55e', label: 'Low' } }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckSquare size={22} color="#f59e0b" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Todo</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>To-do list</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--card)', borderRadius: 6 }}>
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['done', 'Completed'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k as any)} style={{
              padding: '4px 12px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: filter === k ? 600 : 400,
              background: filter === k ? 'var(--accent)' : 'transparent',
              color: filter === k ? '#fff' : 'var(--text2)',
            }}>{l}</button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> New Todo</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
          <CheckSquare size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>{filter === 'done' ? 'No completed todos yet' : 'No todos yet, click New Todo to add one'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const p = priorities[t.priority] || priorities.medium
            return (
              <div key={t.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12, opacity: t.completed ? 0.5 : 1,
              }}>
                <button onClick={() => toggle(t.id, t.completed)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2,
                  color: t.completed ? 'var(--accent)' : 'var(--text3)', flexShrink: 0,
                }}>
                  {t.completed ? <Check size={20} /> : <Circle size={20} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 500,
                      textDecoration: t.completed ? 'line-through' : 'none',
                      color: t.completed ? 'var(--text3)' : 'var(--text)',
                    }}>{t.title}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4, color: '#fff',
                      background: p.color, fontWeight: 600, lineHeight: '16px',
                    }}>{p.label}</span>
                  </div>
                  {t.description && (
                    <p style={{
                      fontSize: 13, color: 'var(--text2)', margin: '4px 0 0',
                      textDecoration: t.completed ? 'line-through' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}>{t.description}</p>
                  )}
                  {t.due_date && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, display: 'inline-block' }}>
                      {t.due_date}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => { setEditing(t); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                  <button onClick={() => del(t.id)} style={iconBtn}><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showModal && <TodoModal entry={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function TodoModal({ entry, onClose, onSaved }: { entry: any; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(entry?.title || '')
  const [description, setDescription] = useState(entry?.description || '')
  const [dueDate, setDueDate] = useState(entry?.due_date || '')
  const [priority, setPriority] = useState(entry?.priority || 'medium')

  async function save() {
    if (!title.trim()) return
    if (entry) {
      await dbRun('UPDATE todos SET title=?, description=?, due_date=?, priority=? WHERE id=?', [title, description, dueDate || null, priority, entry.id])
    } else {
      await dbRun('INSERT INTO todos (title, description, due_date, priority) VALUES (?,?,?,?)', [title, description, dueDate || null, priority])
    }
    onSaved()
  }

  const priorityOptions = [
    { key: 'high', label: 'High', color: '#ef4444' },
    { key: 'medium', label: 'Medium', color: '#f59e0b' },
    { key: 'low', label: 'Low', color: '#22c55e' },
  ]

  return (
    <Modal onClose={onClose} title={entry ? 'Edit Todo' : 'New Todo'}>
      <div>
        <label style={labelStyle}>Title</label>
        <input style={input} placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      </div>
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 80 }} rows={3} placeholder="Details..." value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Due Date (optional)</label>
          <input style={input} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Priority</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {priorityOptions.map(p => (
              <button key={p.key} onClick={() => setPriority(p.key)} style={{
                flex: 1, padding: '8px 6px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                border: priority === p.key ? `2px solid ${p.color}` : '1px solid var(--border)',
                background: priority === p.key ? p.color + '15' : 'var(--bg)',
                color: priority === p.key ? p.color : 'var(--text2)',
                fontWeight: priority === p.key ? 600 : 400,
              }}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

// ── Shared ──
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties
const btnSecondary = { padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' } as React.CSSProperties
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', alignItems: 'center' } as React.CSSProperties
const input = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, marginBottom: 8 } as React.CSSProperties
const labelStyle = { fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--text2)' } as React.CSSProperties

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
      </div>
    </div>
  )
}
