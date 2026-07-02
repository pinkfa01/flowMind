import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Atom, FileText, Lightbulb, Clock, FolderGit2, ExternalLink } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function PhysicsAI() {
  const [tab, setTab] = useState<'notes' | 'timeline' | 'projects'>('notes')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,149,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Atom size={22} color="#ff9500" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>AI Research</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Investment notes, timeline & watchlist</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['notes', 'Investment Notes'], ['timeline', 'Timeline'], ['projects', 'Watchlist']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'notes' && <Notes />}
      {tab === 'timeline' && <Timeline />}
      {tab === 'projects' && <Projects />}
    </div>
  )
}

function Notes() {
  const [notes, setNotes] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() { setNotes(await dbQuery('SELECT * FROM research_notes ORDER BY created_at DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this note?')) return
    await dbRun('DELETE FROM research_notes WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{notes.length} notes</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> New Note</button>
      </div>
      {notes.length === 0 ? <EmptyState icon={Lightbulb} text="No notes yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => (
            <div key={n.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{n.title}</span>
                {n.tags && <div style={{ display: 'flex', gap: 4 }}>{n.tags.split(',').map((t: string) => <span key={t} style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg)', fontSize: 11, color: 'var(--text2)' }}>{t.trim()}</span>)}</div>}
                <button onClick={() => { setEditing(n); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(n.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.content}</p>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>{n.created_at?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}
      {showModal && <NoteModal note={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function NoteModal({ note, onClose, onSaved }: { note: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(note ? { title: note.title, content: note.content, tags: note.tags } : { title: '', content: '', tags: '' })
  async function save() {
    if (!f.title.trim()) return
    if (note) await dbRun('UPDATE research_notes SET title=?, content=?, tags=?, updated_at=datetime(\'now\') WHERE id=?', [f.title, f.content, f.tags, note.id])
    else await dbRun('INSERT INTO research_notes (title, content, tags) VALUES (?,?,?)', [f.title, f.content, f.tags])
    onSaved()
  }
  return (
    <Modal onClose={onClose} title={note ? 'Edit Note' : 'New Note'}>
      <input style={input} placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <input style={input} placeholder="Tags (comma separated)" value={f.tags} onChange={e => setF({ ...f, tags: e.target.value })} />
      <textarea style={{ ...input, resize: 'vertical', minHeight: 120 }} rows={8} placeholder="Content" value={f.content} onChange={e => setF({ ...f, content: e.target.value })} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

function Timeline() {
  const [events, setEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  async function load() { setEvents(await dbQuery('SELECT * FROM timeline_events ORDER BY date DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this event?')) return
    await dbRun('DELETE FROM timeline_events WHERE id = ?', [id])
    load()
  }

  const catIcons: any = { paper: FileText, breakthrough: Lightbulb, funding: Atom, product: FolderGit2, market: Clock }
  const catColors: any = { paper: '#3b82f6', breakthrough: '#f59e0b', funding: '#22c55e', product: '#8b5cf6', market: '#ef4444' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{events.length} events</span>
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={14} /> Add Event</button>
      </div>
      {events.length === 0 ? <EmptyState icon={Clock} text="No events yet" /> : (
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {events.map(e => {
            const Icon = catIcons[e.category] || FileText
            const color = catColors[e.category] || '#3b82f6'
            return (
              <div key={e.id} style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', left: -22, top: 4, width: 16, height: 16, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={10} color="#fff" />
                </div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{e.date}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, marginLeft: 8 }}>{e.title}</span>
                    <div style={{ flex: 1 }} />
                    {'★'.repeat(e.importance)}
                    <button onClick={() => del(e.id)} style={iconBtn}><Trash2 size={14} /></button>
                  </div>
                  {e.description && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>{e.description}</p>}
                  {e.source && <a href={e.source} target="_blank" style={{ color: 'var(--accent)', fontSize: 12 }}>{e.source}</a>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showModal && <TimelineModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function TimelineModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), title: '', description: '', source: '', category: 'paper', importance: 3 })
  async function save() {
    if (!f.title.trim()) return
    await dbRun('INSERT INTO timeline_events (date, title, description, source, category, importance) VALUES (?,?,?,?,?,?)', [f.date, f.title, f.description, f.source, f.category, f.importance])
    onSaved()
  }
  return (
    <Modal onClose={onClose} title="Add Event">
      <input style={input} type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
      <input style={input} placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <textarea style={{ ...input, resize: 'vertical', minHeight: 60 }} rows={3} placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <input style={input} placeholder="Source" value={f.source} onChange={e => setF({ ...f, source: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <select style={input} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          <option value="paper">Paper</option><option value="breakthrough">Breakthrough</option><option value="funding">Funding</option><option value="product">Product</option><option value="market">Market</option>
        </select>
        <select style={input} value={f.importance} onChange={e => setF({ ...f, importance: Number(e.target.value) })}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

function Projects() {
  const [projects, setProjects] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  async function load() { setProjects(await dbQuery('SELECT * FROM tracked_projects ORDER BY last_update DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this ticker?')) return
    await dbRun('DELETE FROM tracked_projects WHERE id = ?', [id])
    load()
  }

  const statusColors: any = { watching: '#f59e0b', holding: '#22c55e', sold: '#94a3b8', passed: '#ef4444' }
  const statusLabels: any = { watching: 'Watching', holding: 'Holding', sold: 'Sold', passed: 'Passed' }
  const positionLabels: any = { long: 'Long', short: 'Short', none: 'None' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{projects.length} tickers</span>
        <button onClick={() => setShowModal(true) } style={btnPrimary}><Plus size={14} /> Add Ticker</button>
      </div>
      {projects.length === 0 ? <EmptyState icon={FolderGit2} text="No tickers yet" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                {p.ticker && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace' }}>{p.ticker}</span>}
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: (statusColors[p.status] || '#94a3b8') + '20', color: statusColors[p.status] || '#94a3b8', fontSize: 11 }}>{statusLabels[p.status] || p.status}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => del(p.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {p.description && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0' }}>{p.description}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13 }}>
                {p.price != null && <span><span style={{ color: 'var(--text3)' }}>Price </span><span style={{ fontWeight: 600 }}>${p.price}</span></span>}
                {p.position && p.position !== 'none' && <span><span style={{ color: 'var(--text3)' }}>Position </span><span style={{ fontWeight: 600, color: p.position === 'long' ? '#22c55e' : '#ef4444' }}>{positionLabels[p.position] || p.position}</span></span>}
                {p.last_update && <span style={{ color: 'var(--text3)', fontSize: 11 }}>{p.last_update}</span>}
              </div>
              {p.url && <a href={p.url} target="_blank" style={{ color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}><ExternalLink size={12} /> {p.url}</a>}
            </div>
          ))}
        </div>
      )}
      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function ProjectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', ticker: '', url: '', description: '', price: '', position: 'none', last_update: new Date().toISOString().slice(0, 10), status: 'watching' })
  async function save() {
    if (!f.name.trim()) return
    await dbRun('INSERT INTO tracked_projects (name, ticker, url, description, price, position, last_update, status) VALUES (?,?,?,?,?,?,?,?)',
      [f.name, f.ticker, f.url, f.description, f.price ? Number(f.price) : null, f.position, f.last_update, f.status])
    onSaved()
  }
  return (
    <Modal onClose={onClose} title="Add Ticker">
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Name</label>
          <input style={{ ...input, marginBottom: 0 }} placeholder="e.g. NVIDIA, IonQ, D-Wave" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Ticker</label>
          <input style={{ ...input, marginBottom: 0, fontFamily: 'monospace' }} placeholder="NVDA" value={f.ticker} onChange={e => setF({ ...f, ticker: e.target.value.toUpperCase() })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Price ($)</label>
          <input style={{ ...input, marginBottom: 0 }} type="number" step="0.01" placeholder="-" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Position</label>
          <select style={{ ...input, marginBottom: 0 }} value={f.position} onChange={e => setF({ ...f, position: e.target.value })}>
            <option value="none">None</option><option value="long">Long</option><option value="short">Short</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Status</label>
          <select style={{ ...input, marginBottom: 0 }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            <option value="watching">Watching</option><option value="holding">Holding</option><option value="sold">Sold</option><option value="passed">Passed</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Updated</label>
          <input style={{ ...input, marginBottom: 0 }} type="date" value={f.last_update} onChange={e => setF({ ...f, last_update: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Research URL</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="https://..." value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>Investment Thesis / Notes</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 80, marginBottom: 0 }} rows={4} placeholder="Bull/bear case? Key catalysts?" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
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
