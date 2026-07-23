import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit3, Wallet, Tag, PieChart as PieIcon, BarChart3, Calendar } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface Category { id: number; name: string; color: string; icon: string }
interface Record { id: number; date: string; category_id: number; amount: number; description: string; is_necessary: number }

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#ff6b6b', icon: 'utensils' },
  { name: 'Transport', color: '#4ecdc4', icon: 'car' },
  { name: 'Shopping', color: '#45b7d1', icon: 'shopping-bag' },
  { name: 'Entertainment', color: '#f9ca24', icon: 'film' },
  { name: 'Housing', color: '#6c5ce7', icon: 'home' },
  { name: 'Health', color: '#00b894', icon: 'heart' },
  { name: 'Education', color: '#fd79a8', icon: 'book' },
  { name: 'Other', color: '#a5b1c2', icon: 'more-horizontal' },
]

export default function Spending() {
  const [tab, setTab] = useState<'daily' | 'monthly' | 'yearly'>('daily')
  const [categories, setCategories] = useState<Category[]>([])

  async function loadCategories() {
    let cats = await dbQuery('SELECT * FROM spending_categories ORDER BY id')
    if (cats.length === 0) {
      for (const c of DEFAULT_CATEGORIES) {
        await dbRun('INSERT INTO spending_categories (name, color, icon) VALUES (?,?,?)', [c.name, c.color, c.icon])
      }
      cats = await dbQuery('SELECT * FROM spending_categories ORDER BY id')
    }
    setCategories(cats)
  }
  useEffect(() => { loadCategories() }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(76,110,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={22} color="#4c6ef5" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Spending</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Track expenses, monthly & yearly stats</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {([['daily', 'Daily Log'], ['monthly', 'Monthly'], ['yearly', 'Yearly']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'daily' && <DailyLog categories={categories} onCategoryChange={loadCategories} />}
      {tab === 'monthly' && <MonthlyView categories={categories} />}
      {tab === 'yearly' && <YearlyView categories={categories} />}
    </div>
  )
}

// ── Daily Log ─────────────────────────────────────────

function DailyLog({ categories, onCategoryChange }: { categories: Category[]; onCategoryChange: () => void }) {
  const [records, setRecords] = useState<Record[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Record | null>(null)
  const [showCatModal, setShowCatModal] = useState(false)

  async function load() { setRecords(await dbQuery('SELECT * FROM spending_records ORDER BY date DESC, id DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Delete this record?')) return
    await dbRun('DELETE FROM spending_records WHERE id = ?', [id])
    load()
  }

  const catMap = useMemo(() => {
    const m: Record<number, Category> = {}
    categories.forEach(c => { m[c.id] = c })
    return m
  }, [categories])

  // Group by date
  const grouped = useMemo(() => {
    const g: Record<string, Record[]> = {}
    records.forEach(r => {
      if (!g[r.date]) g[r.date] = []
      g[r.date].push(r)
    })
    return g
  }, [records])

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return records.filter(r => r.date === today).reduce((s, r) => s + r.amount, 0)
  }, [records])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>{records.length} records</span>
          {todayTotal > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Today: ¥{todayTotal.toFixed(2)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCatModal(true)} style={btnSecondary}><Tag size={14} /> Categories</button>
          <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> New Expense</button>
        </div>
      </div>
      {records.length === 0 ? <EmptyState icon={Wallet} text="No spending records yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(grouped).map(([date, recs]) => {
            const dayTotal = recs.reduce((s, r) => s + r.amount, 0)
            return (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Calendar size={14} color="var(--text3)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{date}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>¥{dayTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recs.map(r => {
                    const cat = catMap[r.category_id]
                    return (
                      <div key={r.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat?.color || '#ccc', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, minWidth: 80 }}>{cat?.name || 'Unknown'}</span>
                        {r.description && <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</span>}
                        {r.is_necessary ? (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>Necessary</span>
                        ) : (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>Optional</span>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', minWidth: 70, textAlign: 'right' }}>¥{r.amount.toFixed(2)}</span>
                        <button onClick={() => { setEditing(r); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                        <button onClick={() => del(r.id)} style={iconBtn}><Trash2 size={14} /></button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showModal && <RecordModal record={editing} categories={categories} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
      {showCatModal && <CategoryModal categories={categories} onClose={() => setShowCatModal(false)} onSaved={() => { setShowCatModal(false); onCategoryChange() }} />}
    </div>
  )
}

function RecordModal({ record, categories, onClose, onSaved }: { record: Record | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(record?.date || new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState(record?.category_id || categories[0]?.id || 1)
  const [amount, setAmount] = useState(record?.amount?.toString() || '')
  const [description, setDescription] = useState(record?.description || '')
  const [isNecessary, setIsNecessary] = useState(record?.is_necessary === 1)

  async function save() {
    if (!amount || Number(amount) <= 0) return
    if (record) {
      await dbRun('UPDATE spending_records SET date=?, category_id=?, amount=?, description=?, is_necessary=? WHERE id=?', [date, categoryId, Number(amount), description, isNecessary ? 1 : 0, record.id])
    } else {
      await dbRun('INSERT INTO spending_records (date, category_id, amount, description, is_necessary) VALUES (?,?,?,?,?)', [date, categoryId, Number(amount), description, isNecessary ? 1 : 0])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={record ? 'Edit Expense' : 'New Expense'}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Date</label>
          <input style={input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Amount (¥)</label>
          <input style={input} type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Category</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategoryId(c.id)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
              border: categoryId === c.id ? `2px solid ${c.color}` : '1px solid var(--border)',
              background: categoryId === c.id ? c.color + '15' : 'var(--bg)',
              color: categoryId === c.id ? c.color : 'var(--text2)', fontWeight: categoryId === c.id ? 600 : 400,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <input style={input} placeholder="What did you buy?" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Necessary Spending?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setIsNecessary(true)} style={{
            flex: 1, padding: '8px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            border: isNecessary ? '2px solid #22c55e' : '1px solid var(--border)',
            background: isNecessary ? 'rgba(34,197,94,0.1)' : 'var(--bg)',
            color: isNecessary ? '#22c55e' : 'var(--text2)', fontWeight: isNecessary ? 600 : 400,
          }}>Necessary</button>
          <button onClick={() => setIsNecessary(false)} style={{
            flex: 1, padding: '8px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            border: !isNecessary ? '2px solid #f59e0b' : '1px solid var(--border)',
            background: !isNecessary ? 'rgba(245,158,11,0.1)' : 'var(--bg)',
            color: !isNecessary ? '#f59e0b' : 'var(--text2)', fontWeight: !isNecessary ? 600 : 400,
          }}>Optional</button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={save} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  )
}

// ── Category Management ──────────────────────────────

function CategoryModal({ categories, onClose, onSaved }: { categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4c6ef5')
  const colorPresets = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#00b894', '#fd79a8', '#a5b1c2', '#e17055', '#00cec9', '#636e72', '#2d3436']

  async function add() {
    if (!name.trim()) return
    await dbRun('INSERT INTO spending_categories (name, color) VALUES (?,?)', [name.trim(), color])
    setName('')
    setColor('#4c6ef5')
    onSaved()
  }

  async function del(id: number) {
    const count = await dbQuery('SELECT COUNT(*) as c FROM spending_records WHERE category_id = ?', [id])
    if (count[0]?.c > 0) {
      if (!confirm(`This category has ${count[0].c} records. Delete anyway? Records will be cascade-deleted.`)) return
    } else {
      if (!confirm('Delete this category?')) return
    }
    await dbRun('DELETE FROM spending_categories WHERE id = ?', [id])
    onSaved()
  }

  async function updateColor(id: number, newColor: string) {
    await dbRun('UPDATE spending_categories SET color = ? WHERE id = ?', [newColor, id])
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="Categories">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflow: 'auto' }}>
        {categories.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <input type="color" value={c.color} onChange={e => updateColor(c.id, e.target.value)} style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
            <button onClick={() => del(c.id)} style={iconBtn}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <input style={{ ...input, flex: 1, marginBottom: 0 }} placeholder="New category name" value={name} onChange={e => setName(e.target.value)} />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
        <button onClick={add} style={btnPrimary}><Plus size={14} /> Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        {colorPresets.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: 4, border: color === c ? '2px solid var(--text)' : '2px solid transparent', background: c, cursor: 'pointer' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={btnSecondary}>Done</button>
      </div>
    </Modal>
  )
}

// ── Monthly View ──────────────────────────────────────

function MonthlyView({ categories }: { categories: Category[] }) {
  const [records, setRecords] = useState<Record[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  async function load() {
    const all = await dbQuery('SELECT * FROM spending_records WHERE date LIKE ? ORDER BY date DESC', [month + '%'])
    setRecords(all)
  }
  useEffect(() => { load() }, [month])

  const catMap = useMemo(() => { const m: Record<number, Category> = {}; categories.forEach(c => { m[c.id] = c }); return m }, [categories])

  const chartData = useMemo(() => {
    const m: Record<number, number> = {}
    records.forEach(r => { m[r.category_id] = (m[r.category_id] || 0) + r.amount })
    return Object.entries(m).map(([cid, amount]) => ({
      name: catMap[Number(cid)]?.name || 'Unknown',
      value: Math.round(amount * 100) / 100,
      color: catMap[Number(cid)]?.color || '#ccc',
    })).sort((a, b) => b.value - a.value)
  }, [records, catMap])

  const total = chartData.reduce((s, d) => s + d.value, 0)
  const necessaryTotal = records.filter(r => r.is_necessary).reduce((s, r) => s + r.amount, 0)
  const optionalTotal = total - necessaryTotal

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...input, width: 'auto', marginBottom: 0 }} />
        {total > 0 && <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>Total: ¥{total.toFixed(2)}</span>}
      </div>

      {records.length === 0 ? <EmptyState icon={PieIcon} text="No data for this month" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Pie Chart */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>By Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => total > 0 ? `${((e.value / total) * 100).toFixed(0)}%` : ''}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chartData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <span style={{ fontWeight: 600 }}>¥{d.value.toFixed(2)}</span>
                  <span style={{ color: 'var(--text3)', minWidth: 45, textAlign: 'right' }}>{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', fontSize: 13 }}>
                <span style={{ color: '#22c55e', flex: 1 }}>Necessary</span>
                <span style={{ fontWeight: 600, color: '#22c55e' }}>¥{necessaryTotal.toFixed(2)} ({total > 0 ? ((necessaryTotal / total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', fontSize: 13 }}>
                <span style={{ color: '#f59e0b', flex: 1 }}>Optional</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>¥{optionalTotal.toFixed(2)} ({total > 0 ? ((optionalTotal / total) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Yearly View ───────────────────────────────────────

function YearlyView({ categories }: { categories: Category[] }) {
  const [records, setRecords] = useState<Record[]>([])
  const [year, setYear] = useState(new Date().getFullYear().toString())

  async function load() {
    const all = await dbQuery('SELECT * FROM spending_records WHERE date LIKE ? ORDER BY date DESC', [year + '%'])
    setRecords(all)
  }
  useEffect(() => { load() }, [year])

  const catMap = useMemo(() => { const m: Record<number, Category> = {}; categories.forEach(c => { m[c.id] = c }); return m }, [categories])

  const chartData = useMemo(() => {
    const m: Record<number, number> = {}
    records.forEach(r => { m[r.category_id] = (m[r.category_id] || 0) + r.amount })
    return Object.entries(m).map(([cid, amount]) => ({
      name: catMap[Number(cid)]?.name || 'Unknown',
      value: Math.round(amount * 100) / 100,
      color: catMap[Number(cid)]?.color || '#ccc',
    })).sort((a, b) => b.value - a.value)
  }, [records, catMap])

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const m = months.map(name => ({ name, amount: 0 }))
    records.forEach(r => {
      const mo = parseInt(r.date.slice(5, 7)) - 1
      if (mo >= 0 && mo < 12) m[mo].amount += r.amount
    })
    return m.map(d => ({ ...d, amount: Math.round(d.amount * 100) / 100 }))
  }, [records])

  const total = chartData.reduce((s, d) => s + d.value, 0)
  const necessaryTotal = records.filter(r => r.is_necessary).reduce((s, r) => s + r.amount, 0)
  const optionalTotal = total - necessaryTotal
  const avgMonthly = total / 12

  const years = useMemo(() => {
    const ys = new Set(records.map(r => r.date.slice(0, 4)))
    ys.add(new Date().getFullYear().toString())
    return Array.from(ys).sort().reverse()
  }, [records])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <select value={year} onChange={e => setYear(e.target.value)} style={{ ...input, width: 'auto', marginBottom: 0 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {total > 0 && <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>Year Total: ¥{total.toFixed(2)}</span>}
      </div>

      {records.length === 0 ? <EmptyState icon={BarChart3} text="No data for this year" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <StatCard label="Total" value={`¥${total.toFixed(2)}`} color="var(--accent)" />
            <StatCard label="Avg / Month" value={`¥${avgMonthly.toFixed(2)}`} color="#45b7d1" />
            <StatCard label="Necessary" value={`¥${necessaryTotal.toFixed(2)}`} color="#22c55e" sub={total > 0 ? `${((necessaryTotal / total) * 100).toFixed(0)}%` : ''} />
            <StatCard label="Optional" value={`¥${optionalTotal.toFixed(2)}`} color="#f59e0b" sub={total > 0 ? `${((optionalTotal / total) * 100).toFixed(0)}%` : ''} />
          </div>

          {/* Pie + Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Category Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e: any) => total > 0 ? `${((e.value / total) * 100).toFixed(0)}%` : ''}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto' }}>
                {chartData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{d.name}</span>
                    <span style={{ fontWeight: 600 }}>¥{d.value.toFixed(2)}</span>
                    <span style={{ color: 'var(--text3)', minWidth: 45, textAlign: 'right' }}>{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly trend bar chart */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text2)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text2)' }} />
                <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Shared ──
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties
const btnSecondary = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' } as React.CSSProperties
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
