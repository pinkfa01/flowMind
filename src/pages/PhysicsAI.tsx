import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Atom, FileText, Lightbulb, Clock, FolderGit2, ExternalLink } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function PhysicsAI() {
  const [tab, setTab] = useState<'papers' | 'notes' | 'timeline' | 'projects'>('papers')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,149,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Atom size={22} color="#ff9500" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>物理AI研究</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>论文追踪、研究笔记、时间线</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['papers', '论文'], ['notes', '笔记'], ['timeline', '时间线'], ['projects', '项目']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'papers' && <Papers />}
      {tab === 'notes' && <Notes />}
      {tab === 'timeline' && <Timeline />}
      {tab === 'projects' && <Projects />}
    </div>
  )
}

function Papers() {
  const [papers, setPapers] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() {
    let sql = 'SELECT * FROM papers'
    const params: any[] = []
    const conds: string[] = []
    if (filter) { conds.push('title LIKE ?'); params.push('%' + filter + '%') }
    if (statusFilter) { conds.push('status = ?'); params.push(statusFilter) }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ')
    sql += ' ORDER BY created_at DESC'
    setPapers(await dbQuery(sql, params))
  }
  useEffect(() => { load() }, [filter, statusFilter])

  async function del(id: number) {
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM papers WHERE id = ?', [id])
    load()
  }

  async function cycleStatus(p: any) {
    const next = { to_read: 'reading', reading: 'completed', completed: 'to_read' }
    await dbRun('UPDATE papers SET status = ? WHERE id = ?', [next[p.status as keyof typeof next], p.id])
    load()
  }

  const statusColors: any = { to_read: '#94a3b8', reading: '#3b82f6', completed: '#22c55e' }
  const statusLabels: any = { to_read: '待读', reading: '阅读中', completed: '已完成' }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} placeholder="搜索论文..." value={filter} onChange={e => setFilter(e.target.value)} />
        <select style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option><option value="to_read">待读</option><option value="reading">阅读中</option><option value="completed">已完成</option>
        </select>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> 添加</button>
      </div>
      {papers.length === 0 ? <EmptyState icon={FileText} text="暂无论文" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {papers.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{p.title}</span>
                <button onClick={() => cycleStatus(p)} style={{ padding: '2px 10px', borderRadius: 4, border: 'none', background: statusColors[p.status] + '20', color: statusColors[p.status], fontSize: 12, cursor: 'pointer', marginRight: 8 }}>{statusLabels[p.status]}</button>
                <button onClick={() => { setEditing(p); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(p.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {p.authors && <p style={{ color: 'var(--text3)', fontSize: 12, margin: '2px 0 0' }}>{p.authors}</p>}
              {p.tags && <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>{p.tags.split(',').map((t: string) => <span key={t} style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg)', fontSize: 11, color: 'var(--text2)' }}>{t.trim()}</span>)}</div>}
              {p.abstract && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>{p.abstract.slice(0, 150)}{p.abstract.length > 150 ? '...' : ''}</p>}
            </div>
          ))}
        </div>
      )}
      {showModal && <PaperModal paper={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function PaperModal({ paper, onClose, onSaved }: { paper: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(paper || { title: '', authors: '', arxiv_id: '', published_date: '', abstract: '', tags: '', status: 'to_read', notes: '' })
  async function save() {
    if (!f.title.trim()) return
    if (paper) await dbRun('UPDATE papers SET title=?, authors=?, arxiv_id=?, published_date=?, abstract=?, tags=?, status=?, notes=? WHERE id=?', [f.title, f.authors, f.arxiv_id, f.published_date, f.abstract, f.tags, f.status, f.notes, paper.id])
    else await dbRun('INSERT INTO papers (title, authors, arxiv_id, published_date, abstract, tags, status, notes) VALUES (?,?,?,?,?,?,?,?)', [f.title, f.authors, f.arxiv_id, f.published_date, f.abstract, f.tags, f.status, f.notes])
    onSaved()
  }
  return (
    <Modal onClose={onClose} title={paper ? '编辑论文' : '添加论文'}>
      <input style={input} placeholder="标题" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <input style={input} placeholder="作者" value={f.authors} onChange={e => setF({ ...f, authors: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={input} placeholder="arXiv ID" value={f.arxiv_id} onChange={e => setF({ ...f, arxiv_id: e.target.value })} />
        <input style={input} type="date" value={f.published_date} onChange={e => setF({ ...f, published_date: e.target.value })} />
      </div>
      <input style={input} placeholder="标签(逗号分隔)" value={f.tags} onChange={e => setF({ ...f, tags: e.target.value })} />
      <select style={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
        <option value="to_read">待读</option><option value="reading">阅读中</option><option value="completed">已完成</option>
      </select>
      <textarea style={{ ...input, resize: 'none' }} rows={3} placeholder="摘要" value={f.abstract} onChange={e => setF({ ...f, abstract: e.target.value })} />
      <textarea style={{ ...input, resize: 'none' }} rows={2} placeholder="笔记" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
      </div>
    </Modal>
  )
}

function Notes() {
  const [notes, setNotes] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() { setNotes(await dbQuery('SELECT * FROM research_notes ORDER BY created_at DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM research_notes WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{notes.length} 条笔记</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> 新建笔记</button>
      </div>
      {notes.length === 0 ? <EmptyState icon={Lightbulb} text="暂无研究笔记" /> : (
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
    <Modal onClose={onClose} title={note ? '编辑笔记' : '新建笔记'}>
      <input style={input} placeholder="标题" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <input style={input} placeholder="标签(逗号分隔)" value={f.tags} onChange={e => setF({ ...f, tags: e.target.value })} />
      <textarea style={{ ...input, resize: 'none' }} rows={8} placeholder="内容" value={f.content} onChange={e => setF({ ...f, content: e.target.value })} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
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
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM timeline_events WHERE id = ?', [id])
    load()
  }

  const catIcons: any = { paper: FileText, breakthrough: Lightbulb, conference: Atom, tool: FolderGit2, milestone: Clock }
  const catColors: any = { paper: '#3b82f6', breakthrough: '#f59e0b', conference: '#8b5cf6', tool: '#10b981', milestone: '#ef4444' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{events.length} 个事件</span>
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={14} /> 添加事件</button>
      </div>
      {events.length === 0 ? <EmptyState icon={Clock} text="暂无时间线事件" /> : (
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
    <Modal onClose={onClose} title="添加时间线事件">
      <input style={input} type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
      <input style={input} placeholder="标题" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <textarea style={{ ...input, resize: 'none' }} rows={3} placeholder="描述" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <input style={input} placeholder="来源" value={f.source} onChange={e => setF({ ...f, source: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <select style={input} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          <option value="paper">论文</option><option value="breakthrough">突破</option><option value="conference">会议</option><option value="tool">工具</option><option value="milestone">里程碑</option>
        </select>
        <select style={input} value={f.importance} onChange={e => setF({ ...f, importance: Number(e.target.value) })}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
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
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM tracked_projects WHERE id = ?', [id])
    load()
  }

  const statusColors: any = { active: '#22c55e', inactive: '#94a3b8', completed: '#3b82f6', archived: '#6b7280' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{projects.length} 个项目</span>
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={14} /> 添加项目</button>
      </div>
      {projects.length === 0 ? <EmptyState icon={FolderGit2} text="暂无追踪项目" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FolderGit2 size={16} color="var(--text2)" />
                <span style={{ fontWeight: 600, fontSize: 14, marginLeft: 8 }}>{p.name}</span>
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: (statusColors[p.status] || '#94a3b8') + '20', color: statusColors[p.status] || '#94a3b8', fontSize: 11 }}>{p.status}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => del(p.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {p.description && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0' }}>{p.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {p.url && <a href={p.url} target="_blank" style={{ color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={12} /> {p.url}</a>}
                {p.last_update && <span style={{ color: 'var(--text3)', fontSize: 11 }}>{p.last_update}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function ProjectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', url: '', description: '', last_update: new Date().toISOString().slice(0, 10), status: 'active' })
  async function save() {
    if (!f.name.trim()) return
    await dbRun('INSERT INTO tracked_projects (name, url, description, last_update, status) VALUES (?,?,?,?,?)', [f.name, f.url, f.description, f.last_update, f.status])
    onSaved()
  }
  return (
    <Modal onClose={onClose} title="添加项目">
      <input style={input} placeholder="名称" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
      <input style={input} placeholder="URL" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
      <textarea style={{ ...input, resize: 'none' }} rows={2} placeholder="描述" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={input} type="date" value={f.last_update} onChange={e => setF({ ...f, last_update: e.target.value })} />
        <select style={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="active">活跃</option><option value="inactive">不活跃</option><option value="completed">已完成</option><option value="archived">已归档</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
