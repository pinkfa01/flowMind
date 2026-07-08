import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, BookOpen, Star } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function English() {
  const [tab, setTab] = useState<'words' | 'notes'>('words')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#34c759" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>English</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>词汇 & 笔记</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['words', '词汇'], ['notes', '笔记']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'words' && <Words />}
      {tab === 'notes' && <Notes />}
    </div>
  )
}

function Words() {
  const [words, setWords] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() {
    let sql = 'SELECT * FROM words'
    const params: any[] = []
    if (search) { sql += ' WHERE word LIKE ?'; params.push('%' + search + '%') }
    if (cat) { sql += search ? ' AND category = ?' : ' WHERE category = ?'; params.push(cat) }
    sql += ' ORDER BY created_at DESC'
    setWords(await dbQuery(sql, params))
  }
  useEffect(() => { load() }, [search, cat])

  async function del(id: number) {
    if (!confirm('Delete this word?')) return
    await dbRun('DELETE FROM words WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} placeholder="Search words..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All Categories</option>
          <option value="ielts">IELTS</option>
          <option value="toefl">TOEFL</option>
          <option value="academic">Academic</option>
          <option value="daily">Daily</option>
          <option value="business">Business</option>
          <option value="general">General</option>
        </select>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> Add</button>
      </div>
      {words.length === 0 ? <EmptyState icon={BookOpen} text="No words yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {words.map(w => (
            <div key={w.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{w.word}</span>
                {w.phonetic && <span style={{ color: 'var(--text3)', fontSize: 13, marginLeft: 8 }}>{w.phonetic}</span>}
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', fontSize: 11, color: 'var(--text2)' }}>{w.category}</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n <= w.proficiency ? '#fbbf24' : 'none'} color={n <= w.proficiency ? '#fbbf24' : 'var(--border)'} />)}</div>
                <button onClick={() => { setEditing(w); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(w.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>{w.definition}</p>
              {w.example && (() => {
                try { const arr = JSON.parse(w.example); return Array.isArray(arr) ? arr.map((ex: string, i: number) => <p key={i} style={{ color: 'var(--text3)', fontSize: 12, margin: '2px 0 0', fontStyle: 'italic' }}>{ex}</p>) : [<p key={0} style={{ color: 'var(--text3)', fontSize: 12, margin: '2px 0 0', fontStyle: 'italic' }}>{w.example}</p>] }
                catch { return <p style={{ color: 'var(--text3)', fontSize: 12, margin: '2px 0 0', fontStyle: 'italic' }}>{w.example}</p> }
              })()}
            </div>
          ))}
        </div>
      )}
      {showModal && <WordModal word={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function WordModal({ word, onClose, onSaved }: { word: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(word || { word: '', phonetic: '', definition: '', example: '', category: 'general', proficiency: 0 })
  const [examples, setExamples] = useState<string[]>(() => {
    if (word?.example) {
      try { const arr = JSON.parse(word.example); return Array.isArray(arr) ? arr : [word.example] }
      catch { return [word.example] }
    }
    return ['']
  })

  async function save() {
    if (!form.word.trim()) return
    const filtered = examples.filter(e => e.trim())
    const exampleJson = filtered.length > 0 ? JSON.stringify(filtered) : ''
    if (word) {
      await dbRun('UPDATE words SET word=?, phonetic=?, definition=?, example=?, category=?, proficiency=? WHERE id=?', [form.word, form.phonetic, form.definition, exampleJson, form.category, form.proficiency, word.id])
    } else {
      await dbRun('INSERT INTO words (word, phonetic, definition, example, category, proficiency) VALUES (?,?,?,?,?,?)', [form.word, form.phonetic, form.definition, exampleJson, form.category, form.proficiency])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={word ? 'Edit Word' : 'Add Word'}>
      <input style={input} placeholder="Word" value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} />
      <input style={input} placeholder="Phonetic" value={form.phonetic} onChange={e => setForm({ ...form, phonetic: e.target.value })} />
      <input style={input} placeholder="Definition" value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} />
      <div>
        <label style={labelStyle}>Examples</label>
        {examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <input style={{ ...input, flex: 1, marginBottom: 0 }} placeholder={`Example ${i + 1}`} value={ex} onChange={e => { const n = [...examples]; n[i] = e.target.value; setExamples(n) }} />
            {examples.length > 1 && <button onClick={() => setExamples(examples.filter((_, j) => j !== i))} style={iconBtn}><Trash2 size={14} /></button>}
          </div>
        ))}
        <button onClick={() => setExamples([...examples, ''])} style={{ ...btnPrimary, marginTop: 4 }}><Plus size={14} /> Add Example</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="general">General</option><option value="ielts">IELTS</option><option value="toefl">TOEFL</option>
          <option value="academic">Academic</option><option value="daily">Daily</option><option value="business">Business</option>
        </select>
        <select style={input} value={form.proficiency} onChange={e => setForm({ ...form, proficiency: Number(e.target.value) })}>
          {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n) || 'New'}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

function Notes() {
  const [notes, setNotes] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() { setNotes(await dbQuery('SELECT * FROM reading_notes ORDER BY created_at DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this note?')) return
    await dbRun('DELETE FROM reading_notes WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{notes.length} notes</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> New Note</button>
      </div>
      {notes.length === 0 ? <EmptyState icon={BookOpen} text="No notes yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => (
            <div key={n.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</span>
                <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>{n.created_at?.slice(0, 10)}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => { setEditing(n); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(n.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {n.source_url && <a href={n.source_url} target="_blank" style={{ color: 'var(--accent)', fontSize: 12 }}>{n.source_url}</a>}
              <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
      {showModal && <NoteModal note={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function NoteModal({ note, onClose, onSaved }: { note: any; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(note?.title || '')
  const [url, setUrl] = useState(note?.source_url || '')
  const [content, setContent] = useState(note?.content || '')

  async function save() {
    if (!title.trim()) return
    if (note) {
      await dbRun('UPDATE reading_notes SET title=?, source_url=?, content=? WHERE id=?', [title, url, content, note.id])
    } else {
      await dbRun('INSERT INTO reading_notes (title, source_url, content) VALUES (?,?,?)', [title, url, content])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={note ? 'Edit Note' : 'New Note'}>
      <input style={input} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input style={input} placeholder="Source URL" value={url} onChange={e => setUrl(e.target.value)} />
      <textarea style={{ ...input, resize: 'vertical', minHeight: 200 }} rows={10} placeholder="Content" value={content} onChange={e => setContent(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)' }}>
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
