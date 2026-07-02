import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, BookOpen, Star, CheckCircle } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function English() {
  const [tab, setTab] = useState<'words' | 'checkin' | 'notes'>('words')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#34c759" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>English</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Vocabulary, daily check-in & notes</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['words', 'Vocabulary'], ['checkin', 'Daily Check-in'], ['notes', 'Notes']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'words' && <Words />}
      {tab === 'checkin' && <CheckIn />}
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
              {w.example && <p style={{ color: 'var(--text3)', fontSize: 12, margin: '2px 0 0', fontStyle: 'italic' }}>{w.example}</p>}
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

  async function save() {
    if (!form.word.trim()) return
    if (word) {
      await dbRun('UPDATE words SET word=?, phonetic=?, definition=?, example=?, category=?, proficiency=? WHERE id=?', [form.word, form.phonetic, form.definition, form.example, form.category, form.proficiency, word.id])
    } else {
      await dbRun('INSERT INTO words (word, phonetic, definition, example, category, proficiency) VALUES (?,?,?,?,?,?)', [form.word, form.phonetic, form.definition, form.example, form.category, form.proficiency])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={word ? 'Edit Word' : 'Add Word'}>
      <input style={input} placeholder="Word" value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} />
      <input style={input} placeholder="Phonetic" value={form.phonetic} onChange={e => setForm({ ...form, phonetic: e.target.value })} />
      <input style={input} placeholder="Definition" value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} />
      <input style={input} placeholder="Example" value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} />
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

function CheckIn() {
  const [logs, setLogs] = useState<any[]>([])
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState('vocabulary')
  const [duration, setDuration] = useState(0)
  const [wordsLearned, setWordsLearned] = useState(0)
  const [notes, setNotes] = useState('')

  async function load() { setLogs(await dbQuery('SELECT * FROM study_logs WHERE date = ? ORDER BY id DESC', [today])) }
  useEffect(() => { load() }, [])

  async function checkin() {
    await dbRun('INSERT INTO study_logs (date, type, duration_min, words_learned, notes) VALUES (?,?,?,?,?)', [today, type, duration, wordsLearned, notes])
    setType('vocabulary'); setDuration(0); setWordsLearned(0); setNotes('')
    load()
  }

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i)
    return d.toISOString().slice(0, 10)
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Today's Check-in</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select style={input} value={type} onChange={e => setType(e.target.value)}>
            <option value="vocabulary">Vocabulary</option><option value="reading">Reading</option>
            <option value="listening">Listening</option><option value="speaking">Speaking</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={input} type="number" placeholder="Duration (min)" value={duration || ''} onChange={e => setDuration(Number(e.target.value))} />
            <input style={input} type="number" placeholder="Words learned" value={wordsLearned || ''} onChange={e => setWordsLearned(Number(e.target.value))} />
          </div>
          <textarea style={{ ...input, resize: 'none' }} rows={2} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <button onClick={checkin} style={btnPrimary}><CheckCircle size={14} /> Check in</button>
        </div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>This Week</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          {weekDays.map(d => {
            const checked = logs.some(l => l.date === d)
            const isToday = d === today
            return (
              <div key={d} style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked ? 'var(--accent)' : 'var(--bg)', color: checked ? '#fff' : 'var(--text3)', border: isToday ? '2px solid var(--accent)' : 'none' }}>
                  {checked && <CheckCircle size={16} />}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{d.slice(5)}</span>
              </div>
            )
          })}
        </div>
        <h4 style={{ fontSize: 13, fontWeight: 500, margin: '12px 0 6px' }}>Today's Logs</h4>
        {logs.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>None</p> : logs.map(l => (
          <div key={l.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{l.type} - {l.duration_min}min</span>
            <span style={{ color: 'var(--text3)' }}>{l.words_learned} words</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Notes() {
  const [notes, setNotes] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

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
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={14} /> New Note</button>
      </div>
      {notes.length === 0 ? <EmptyState icon={BookOpen} text="No notes yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => (
            <div key={n.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</span>
                <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>{n.created_at?.slice(0, 10)}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => del(n.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {n.source_url && <a href={n.source_url} target="_blank" style={{ color: 'var(--accent)', fontSize: 12 }}>{n.source_url}</a>}
              <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
      {showModal && <NoteModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function NoteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')

  async function save() {
    if (!title.trim()) return
    await dbRun('INSERT INTO reading_notes (title, source_url, content) VALUES (?,?,?)', [title, url, content])
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="New Note">
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
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
