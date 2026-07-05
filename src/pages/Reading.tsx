import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, BookMarked } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function Reading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookMarked size={22} color="#a855f7" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Reading</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Book management & reading notes</p>
        </div>
      </div>
      <ReadingList />
    </div>
  )
}

function ReadingList() {
  const [items, setItems] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() { setItems(await dbQuery('SELECT * FROM reading_materials ORDER BY created_at DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this book?')) return
    await dbRun('DELETE FROM reading_materials WHERE id = ?', [id])
    load()
  }

  async function cycleStatus(item: any) {
    const next: any = { reading: 'completed', completed: 'archived', archived: 'reading' }
    await dbRun('UPDATE reading_materials SET status = ? WHERE id = ?', [next[item.status], item.id])
    load()
  }

  const statusColors: any = { reading: '#3b82f6', completed: '#22c55e', archived: '#94a3b8' }
  const statusLabels: any = { reading: 'Reading', completed: 'Finished', archived: 'Archived' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{items.length} books</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> Add Book</button>
      </div>
      {items.length === 0 ? <EmptyState icon={BookMarked} text="No books yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(m => (
            <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{m.title}</span>
                <button onClick={() => cycleStatus(m)} style={{ padding: '2px 10px', borderRadius: 4, border: 'none', background: (statusColors[m.status] || '#94a3b8') + '20', color: statusColors[m.status] || '#94a3b8', fontSize: 12, cursor: 'pointer', marginRight: 8 }}>{statusLabels[m.status] || m.status}</button>
                <button onClick={() => { setEditing(m); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(m.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {m.source_url && <a href={m.source_url} target="_blank" style={{ color: 'var(--accent)', fontSize: 12, display: 'block', marginTop: 2 }}>Link</a>}
              {m.notes && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{m.notes}</p>}
            </div>
          ))}
        </div>
      )}
      {showModal && <ReadingListModal item={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function ReadingListModal({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(item ? { title: item.title, source_url: item.source_url, status: item.status, notes: item.notes }
    : { title: '', source_url: '', status: 'reading', notes: '' })

  async function save() {
    if (!f.title.trim()) return
    if (item) {
      await dbRun('UPDATE reading_materials SET title=?, source_url=?, status=?, notes=? WHERE id=?', [f.title, f.source_url, f.status, f.notes, item.id])
    } else {
      await dbRun('INSERT INTO reading_materials (title, source_url, status, notes) VALUES (?,?,?,?)', [f.title, f.source_url, f.status, f.notes])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={item ? 'Edit Book' : 'Add Book'}>
      <div>
        <label style={labelStyle}>Book Title</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="Book title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>Link (optional)</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="https://..." value={f.source_url} onChange={e => setF({ ...f, source_url: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>Status</label>
        <select style={{ ...input, marginBottom: 0 }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="reading">Reading</option><option value="completed">Finished</option><option value="archived">Archived</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Reading Notes</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 0 }} rows={3} placeholder="Excerpts, thoughts..." value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
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
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)' }}>
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
