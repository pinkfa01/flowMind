import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, BookOpen, Star, CheckCircle } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function English() {
  const [tab, setTab] = useState<'words' | 'checkin' | 'reading' | 'notes'>('words')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#34c759" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>英语学习</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>单词本、每日打卡、阅读、笔记</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['words', '单词本'], ['checkin', '每日打卡'], ['reading', '阅读'], ['notes', '笔记']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'words' && <Words />}
      {tab === 'checkin' && <CheckIn />}
      {tab === 'reading' && <ReadingList />}
      {tab === 'notes' && <Reading />}
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
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM words WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} placeholder="搜索单词..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">全部分类</option>
          <option value="ielts">雅思</option>
          <option value="toefl">托福</option>
          <option value="academic">学术</option>
          <option value="daily">日常</option>
          <option value="business">商务</option>
          <option value="general">通用</option>
        </select>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> 添加</button>
      </div>
      {words.length === 0 ? <EmptyState icon={BookOpen} text="暂无单词" /> : (
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
    <Modal onClose={onClose} title={word ? '编辑单词' : '添加单词'}>
      <input style={input} placeholder="单词" value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} />
      <input style={input} placeholder="音标" value={form.phonetic} onChange={e => setForm({ ...form, phonetic: e.target.value })} />
      <input style={input} placeholder="释义" value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} />
      <input style={input} placeholder="例句" value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="general">通用</option><option value="ielts">雅思</option><option value="toefl">托福</option>
          <option value="academic">学术</option><option value="daily">日常</option><option value="business">商务</option>
        </select>
        <select style={input} value={form.proficiency} onChange={e => setForm({ ...form, proficiency: Number(e.target.value) })}>
          {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n) || '未学'}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
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
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>今日打卡</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select style={input} value={type} onChange={e => setType(e.target.value)}>
            <option value="vocabulary">词汇</option><option value="reading">阅读</option>
            <option value="listening">听力</option><option value="speaking">口语</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={input} type="number" placeholder="时长min" value={duration || ''} onChange={e => setDuration(Number(e.target.value))} />
            <input style={input} type="number" placeholder="学习单词数" value={wordsLearned || ''} onChange={e => setWordsLearned(Number(e.target.value))} />
          </div>
          <textarea style={{ ...input, resize: 'none' }} rows={2} placeholder="备注" value={notes} onChange={e => setNotes(e.target.value)} />
          <button onClick={checkin} style={btnPrimary}><CheckCircle size={14} /> 打卡</button>
        </div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>本周打卡</h3>
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
        <h4 style={{ fontSize: 13, fontWeight: 500, margin: '12px 0 6px' }}>今日记录</h4>
        {logs.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>暂无</p> : logs.map(l => (
          <div key={l.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{l.type} - {l.duration_min}min</span>
            <span style={{ color: 'var(--text3)' }}>{l.words_learned}词</span>
          </div>
        ))}
      </div>
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
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM reading_materials WHERE id = ?', [id])
    load()
  }

  async function cycleStatus(item: any) {
    const next: any = { reading: 'completed', completed: 'archived', archived: 'reading' }
    await dbRun('UPDATE reading_materials SET status = ? WHERE id = ?', [next[item.status], item.id])
    load()
  }

  const statusColors: any = { reading: '#3b82f6', completed: '#22c55e', archived: '#94a3b8' }
  const statusLabels: any = { reading: '在读', completed: '已完成', archived: '已归档' }
  const typeLabels: any = { book: '书', audiobook: '有声书', ebook: '电子书' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{items.length} 本书</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> 添加</button>
      </div>
      {items.length === 0 ? <EmptyState icon={BookOpen} text="暂无读书记录" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(m => (
            <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{m.title}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', fontSize: 11, color: 'var(--text2)', marginRight: 8 }}>{typeLabels[m.type] || m.type}</span>
                <button onClick={() => cycleStatus(m)} style={{ padding: '2px 10px', borderRadius: 4, border: 'none', background: (statusColors[m.status] || '#94a3b8') + '20', color: statusColors[m.status] || '#94a3b8', fontSize: 12, cursor: 'pointer', marginRight: 8 }}>{statusLabels[m.status] || m.status}</button>
                <button onClick={() => { setEditing(m); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(m.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {m.source_url && <a href={m.source_url} target="_blank" style={{ color: 'var(--accent)', fontSize: 12, display: 'block', marginTop: 2 }}>详情链接</a>}
              {m.notes && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>{m.notes}</p>}
              {m.status === 'reading' && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg)' }}>
                      <div style={{ width: `${m.progress}%`, height: '100%', borderRadius: 3, background: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.progress}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && <ReadingListModal item={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function ReadingListModal({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(item ? { title: item.title, source_url: item.source_url, type: item.type, status: item.status, progress: item.progress, notes: item.notes }
    : { title: '', source_url: '', type: 'book', status: 'reading', progress: 0, notes: '' })

  async function save() {
    if (!f.title.trim()) return
    if (item) {
      await dbRun('UPDATE reading_materials SET title=?, source_url=?, type=?, status=?, progress=?, notes=? WHERE id=?', [f.title, f.source_url, f.type, f.status, f.progress, f.notes, item.id])
    } else {
      await dbRun('INSERT INTO reading_materials (title, source_url, type, status, progress, notes) VALUES (?,?,?,?,?,?)', [f.title, f.source_url, f.type, f.status, f.progress, f.notes])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={item ? '编辑书籍' : '添加书籍'}>
      <div>
        <label style={labelStyle}>书名</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="书名" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>链接（可选）</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="https://..." value={f.source_url} onChange={e => setF({ ...f, source_url: e.target.value })} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>类型</label>
          <select style={{ ...input, marginBottom: 0 }} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
            <option value="book">书</option><option value="ebook">电子书</option><option value="audiobook">有声书</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>状态</label>
          <select style={{ ...input, marginBottom: 0 }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            <option value="reading">在读</option><option value="completed">已完成</option><option value="archived">已归档</option>
          </select>
        </div>
      </div>
      {f.status === 'reading' && (
        <div>
          <label style={labelStyle}>阅读进度: {f.progress}%</label>
          <input type="range" min={0} max={100} value={f.progress} style={{ width: '100%' }} onChange={e => setF({ ...f, progress: Number(e.target.value) })} />
        </div>
      )}
      <div>
        <label style={labelStyle}>读书笔记</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 0 }} rows={3} placeholder="摘录、生词、感想..." value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
      </div>
    </Modal>
  )
}

function Reading() {
  const [notes, setNotes] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  async function load() { setNotes(await dbQuery('SELECT * FROM reading_notes ORDER BY created_at DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM reading_notes WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{notes.length} 条笔记</span>
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={14} /> 新建笔记</button>
      </div>
      {notes.length === 0 ? <EmptyState icon={BookOpen} text="暂无阅读笔记" /> : (
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
      {showModal && <ReadingModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function ReadingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')

  async function save() {
    if (!title.trim()) return
    await dbRun('INSERT INTO reading_notes (title, source_url, content) VALUES (?,?,?)', [title, url, content])
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="新建阅读笔记">
      <input style={input} placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} />
      <input style={input} placeholder="来源URL" value={url} onChange={e => setUrl(e.target.value)} />
      <textarea style={{ ...input, resize: 'vertical', minHeight: 200 }} rows={10} placeholder="笔记内容" value={content} onChange={e => setContent(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
      </div>
    </Modal>
  )
}

// ── 通用组件 ──
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
