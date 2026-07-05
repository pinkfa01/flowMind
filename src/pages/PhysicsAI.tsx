import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, TrendingUp, DollarSign, Eye, Lightbulb } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

export default function PhysicsAI() {
  const [tab, setTab] = useState<'views' | 'positions' | 'philosophy'>('views')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,149,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={22} color="#ff9500" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Investment</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Market views, portfolio & philosophy</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['views', 'Views'], ['positions', 'Positions'], ['philosophy', 'Philosophy']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'views' && <Views />}
      {tab === 'positions' && <Positions />}
      {tab === 'philosophy' && <Philosophy />}
    </div>
  )
}

// ── Views (观点) ──────────────────────────────────────

function Views() {
  const [items, setItems] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [editingMyTake, setEditingMyTake] = useState<any>(null)

  async function load() { setItems(await dbQuery('SELECT * FROM investment_views ORDER BY date DESC, id DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this view?')) return
    await dbRun('DELETE FROM investment_views WHERE id = ?', [id])
    load()
  }

  async function saveMyTake(id: number, text: string) {
    await dbRun('UPDATE investment_views SET my_take = ? WHERE id = ?', [text, id])
    setEditingMyTake(null)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{items.length} views</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> New View</button>
      </div>
      {items.length === 0 ? <EmptyState icon={Eye} text="No views yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(v => (
            <div key={v.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v.source}</span>
                <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>{v.date}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => { setEditing(v); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={() => del(v.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              <p style={{ color: 'var(--text)', fontSize: 14, margin: '8px 0 4px', fontWeight: 500 }}>{v.view}</p>
              {v.reason && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '0 0 8px' }}><span style={{ color: 'var(--text3)' }}>Reason: </span>{v.reason}</p>}
              {/* My Take */}
              <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: 'var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>My Take</span>
                  {editingMyTake !== v.id && v.my_take && <button onClick={() => setEditingMyTake(v.id)} style={iconBtn}><Edit3 size={12} /></button>}
                </div>
                {editingMyTake === v.id ? (
                  <div>
                    <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 4 }} rows={3} placeholder="Your thoughts..." defaultValue={v.my_take || ''} id={`mytake-${v.id}`} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { const el = document.getElementById(`mytake-${v.id}`) as HTMLTextAreaElement; saveMyTake(v.id, el.value) }} style={btnPrimary}>Save</button>
                      <button onClick={() => setEditingMyTake(null)} style={btnSecondary}>Cancel</button>
                    </div>
                  </div>
                ) : v.my_take ? (
                  <p style={{ color: 'var(--text)', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{v.my_take}</p>
                ) : (
                  <button onClick={() => setEditingMyTake(v.id)} style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: '1px dashed var(--border)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>+ Add your take</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <ViewModal item={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function ViewModal({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(item ? { source: item.source, date: item.date, view: item.view, reason: item.reason }
    : { source: '', date: new Date().toISOString().slice(0, 10), view: '', reason: '' })

  async function save() {
    if (!f.source.trim()) return
    if (item) {
      await dbRun('UPDATE investment_views SET source=?, date=?, view=?, reason=? WHERE id=?', [f.source, f.date, f.view, f.reason, item.id])
    } else {
      await dbRun('INSERT INTO investment_views (source, date, view, reason) VALUES (?,?,?,?)', [f.source, f.date, f.view, f.reason])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={item ? 'Edit View' : 'New View'}>
      <div>
        <label style={labelStyle}>Source (who)</label>
        <input style={{ ...input, marginBottom: 0 }} placeholder="e.g. Goldman Sachs, Warren Buffett, Cathie Wood" value={f.source} onChange={e => setF({ ...f, source: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>Date</label>
        <input style={{ ...input, marginBottom: 0 }} type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>View</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 0 }} rows={3} placeholder="What's their view?" value={f.view} onChange={e => setF({ ...f, view: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>Reason</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 0 }} rows={3} placeholder="Why do they think so?" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

// ── Positions (持仓) ──────────────────────────────────

function Positions() {
  const [items, setItems] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function load() { setItems(await dbQuery('SELECT * FROM investment_positions ORDER BY status, company')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this position?')) return
    await dbRun('DELETE FROM investment_positions WHERE id = ?', [id])
    load()
  }

  async function cycleStatus(item: any) {
    const next: any = { holding: 'watching', watching: 'closed', closed: 'holding' }
    await dbRun('UPDATE investment_positions SET status = ? WHERE id = ?', [next[item.status], item.id])
    load()
  }

  const statusColors: any = { holding: '#22c55e', watching: '#f59e0b', closed: '#94a3b8' }
  const statusLabels: any = { holding: 'Holding', watching: 'Watching', closed: 'Closed' }

  const totalValue = items.filter(i => i.status === 'holding' && i.price && i.quantity).reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalDividend = items.filter(i => i.status === 'holding' && i.dividend).reduce((sum, i) => sum + (i.dividend || 0) * (i.quantity || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>{items.length} positions</span>
          {totalValue > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Total: ${totalValue.toFixed(2)}</span>}
          {totalDividend > 0 && <span style={{ fontSize: 13, color: '#22c55e' }}>Div: ${totalDividend.toFixed(2)}</span>}
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> New Position</button>
      </div>
      {items.length === 0 ? <EmptyState icon={DollarSign} text="No positions yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(p => {
            const value = (p.price && p.quantity) ? p.price * p.quantity : 0
            const upside = (p.target_price && p.price) ? ((p.target_price - p.price) / p.price * 100) : null
            return (
              <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.company}</span>
                  {p.ticker && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace' }}>{p.ticker}</span>}
                  <button onClick={() => cycleStatus(p)} style={{ marginLeft: 8, padding: '2px 10px', borderRadius: 4, border: 'none', background: (statusColors[p.status] || '#94a3b8') + '20', color: statusColors[p.status] || '#94a3b8', fontSize: 12, cursor: 'pointer' }}>{statusLabels[p.status] || p.status}</button>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => { setEditing(p); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                  <button onClick={() => del(p.id)} style={iconBtn}><Trash2 size={14} /></button>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 13, flexWrap: 'wrap' }}>
                  {p.price != null && <span><span style={{ color: 'var(--text3)' }}>Price </span><span style={{ fontWeight: 600 }}>${p.price}</span></span>}
                  {p.quantity != null && <span><span style={{ color: 'var(--text3)' }}>Qty </span><span style={{ fontWeight: 600 }}>{p.quantity}</span></span>}
                  {value > 0 && <span><span style={{ color: 'var(--text3)' }}>Value </span><span style={{ fontWeight: 600 }}>${value.toFixed(2)}</span></span>}
                  {p.dividend != null && <span><span style={{ color: 'var(--text3)' }}>Div </span><span style={{ fontWeight: 600, color: '#22c55e' }}>${p.dividend}</span></span>}
                  {p.target_price != null && <span><span style={{ color: 'var(--text3)' }}>Target </span><span style={{ fontWeight: 600 }}>${p.target_price}</span></span>}
                  {upside != null && <span style={{ color: upside >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{upside >= 0 ? '+' : ''}{upside.toFixed(1)}%</span>}
                </div>
                {p.reason && <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>{p.reason}</p>}
              </div>
            )
          })}
        </div>
      )}
      {showModal && <PositionModal item={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function PositionModal({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(item ? {
    company: item.company, ticker: item.ticker, price: item.price?.toString() || '', quantity: item.quantity?.toString() || '',
    dividend: item.dividend?.toString() || '', target_price: item.target_price?.toString() || '', reason: item.reason, status: item.status
  } : { company: '', ticker: '', price: '', quantity: '', dividend: '', target_price: '', reason: '', status: 'holding' })

  async function save() {
    if (!f.company.trim()) return
    const params = [f.company, f.ticker, f.price ? Number(f.price) : null, f.quantity ? Number(f.quantity) : null,
      f.dividend ? Number(f.dividend) : null, f.target_price ? Number(f.target_price) : null, f.reason, f.status]
    if (item) {
      await dbRun('UPDATE investment_positions SET company=?, ticker=?, price=?, quantity=?, dividend=?, target_price=?, reason=?, status=? WHERE id=?', [...params, item.id])
    } else {
      await dbRun('INSERT INTO investment_positions (company, ticker, price, quantity, dividend, target_price, reason, status) VALUES (?,?,?,?,?,?,?,?)', params)
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={item ? 'Edit Position' : 'New Position'}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Company</label>
          <input style={{ ...input, marginBottom: 0 }} placeholder="e.g. NVIDIA, IonQ" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Ticker</label>
          <input style={{ ...input, marginBottom: 0, fontFamily: 'monospace' }} placeholder="NVDA" value={f.ticker} onChange={e => setF({ ...f, ticker: e.target.value.toUpperCase() })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Price ($)</label>
          <input style={{ ...input, marginBottom: 0 }} type="number" step="0.01" placeholder="0.00" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Quantity</label>
          <input style={{ ...input, marginBottom: 0 }} type="number" step="0.01" placeholder="0" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Dividend ($)</label>
          <input style={{ ...input, marginBottom: 0 }} type="number" step="0.01" placeholder="0.00" value={f.dividend} onChange={e => setF({ ...f, dividend: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Target Price ($)</label>
          <input style={{ ...input, marginBottom: 0 }} type="number" step="0.01" placeholder="0.00" value={f.target_price} onChange={e => setF({ ...f, target_price: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Status</label>
        <select style={{ ...input, marginBottom: 0 }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="holding">Holding</option><option value="watching">Watching</option><option value="closed">Closed</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Reason</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 0 }} rows={3} placeholder="Why hold this position?" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

// ── Philosophy (理念) ─────────────────────────────────

function Philosophy() {
  const [items, setItems] = useState<any[]>([])
  const [text, setText] = useState('')

  async function load() { setItems(await dbQuery('SELECT * FROM investment_philosophies ORDER BY created_at DESC')) }
  useEffect(() => { load() }, [])

  async function add() {
    if (!text.trim()) return
    await dbRun('INSERT INTO investment_philosophies (content) VALUES (?)', [text.trim()])
    setText('')
    load()
  }

  async function del(id: number) {
    if (!confirm('Delete this philosophy?')) return
    await dbRun('DELETE FROM investment_philosophies WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 60, marginBottom: 8 }} rows={3} placeholder="Write your investment philosophy..." value={text} onChange={e => setText(e.target.value)} />
        <button onClick={add} style={btnPrimary}><Plus size={14} /> Add</button>
      </div>
      {items.length === 0 ? <EmptyState icon={Lightbulb} text="No philosophy yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Lightbulb size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: 'var(--text)', fontSize: 14, margin: 0, flex: 1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.content}</p>
              <span style={{ color: 'var(--text3)', fontSize: 11, flexShrink: 0 }}>{p.created_at?.slice(0, 10)}</span>
              <button onClick={() => del(p.id)} style={iconBtn}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 550, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)' }}>
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
