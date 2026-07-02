import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, CalendarDays, Smile, Frown, Meh } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function Journal() {
  const [entries, setEntries] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() { setEntries(await dbQuery('SELECT * FROM journal_entries ORDER BY date DESC, id DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM journal_entries WHERE id = ?', [id])
    load()
  }

  const moodIcons: any = { great: { icon: Smile, color: '#22c55e', label: '😊 很好' }, good: { icon: Smile, color: '#3b82f6', label: '🙂 不错' }, ok: { icon: Meh, color: '#f59e0b', label: '😐 一般' }, bad: { icon: Frown, color: '#ef4444', label: '😕 不好' }, awful: { icon: Frown, color: '#991b1b', label: '😢 糟糕' } }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={22} color="#ec4899" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>日记</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>记录每天的心情与想法</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{entries.length} 篇日记</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> 写日记</button>
      </div>
      {entries.length === 0 ? <EmptyState icon={CalendarDays} text="暂无日记，开始记录今天吧" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => {
            const m = moodIcons[e.mood] || moodIcons.ok
            return (
              <div key={e.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{e.date}</span>
                  <span style={{ marginLeft: 12, fontSize: 13, color: m.color }}>{m.label}</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => { setEditing(e); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                  <button onClick={() => del(e.id)} style={iconBtn}><Trash2 size={14} /></button>
                </div>
                {e.title && <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{e.title}</h3>}
                <p style={{ color: 'var(--text2)', fontSize: 14, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.content}</p>
              </div>
            )
          })}
        </div>
      )}
      {showModal && <JournalModal entry={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function JournalModal({ entry, onClose, onSaved }: { entry: any; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(entry?.date || new Date().toISOString().slice(0, 10))
  const [mood, setMood] = useState(entry?.mood || 'good')
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')

  async function save() {
    if (!content.trim() && !title.trim()) return
    if (entry) {
      await dbRun('UPDATE journal_entries SET date=?, mood=?, title=?, content=? WHERE id=?', [date, mood, title, content, entry.id])
    } else {
      await dbRun('INSERT INTO journal_entries (date, mood, title, content) VALUES (?,?,?,?)', [date, mood, title, content])
    }
    onSaved()
  }

  const moods = [
    { key: 'great', label: '😊 很好', color: '#22c55e' },
    { key: 'good', label: '🙂 不错', color: '#3b82f6' },
    { key: 'ok', label: '😐 一般', color: '#f59e0b' },
    { key: 'bad', label: '😕 不好', color: '#ef4444' },
    { key: 'awful', label: '😢 糟糕', color: '#991b1b' },
  ]

  return (
    <Modal onClose={onClose} title={entry ? '编辑日记' : '写日记'}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>日期</label>
          <input style={{ ...input, marginBottom: 0 }} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>心情</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {moods.map(m => (
            <button key={m.key} onClick={() => setMood(m.key)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 6, border: mood === m.key ? `2px solid ${m.color}` : '1px solid var(--border)',
              background: mood === m.key ? m.color + '15' : 'var(--bg)', color: mood === m.key ? m.color : 'var(--text2)',
              fontSize: 12, cursor: 'pointer', fontWeight: mood === m.key ? 600 : 400
            }}>{m.label}</button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>标题（可选）</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="今天的一句标题" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>正文</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 200, marginBottom: 0 }} rows={10} placeholder="今天发生了什么？有什么想法和感受？" value={content} onChange={e => setContent(e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
      </div>
    </Modal>
  )
}

// ── 通用 ──
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties
const btnSecondary = { padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' } as React.CSSProperties
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', alignItems: 'center' } as React.CSSProperties
const input = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, marginBottom: 8 } as React.CSSProperties
const labelStyle = { fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--text2)' } as React.CSSProperties

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 600, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
      <Icon size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  )
}
