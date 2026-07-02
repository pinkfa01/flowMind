import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight, Dumbbell, Trophy } from 'lucide-react'
import { dbQuery, dbRun } from '../lib/db'

interface Workout { id: number; date: string; name: string; notes: string; duration_min: number; sets: any[] }

export default function Fitness() {
  const [tab, setTab] = useState<'log' | 'metrics' | 'charts'>('log')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(76,110,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dumbbell size={22} color="#4c6ef5" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>健身记录</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>训练日志、身体数据与进度追踪</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card)', borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['log', '训练日志'], ['metrics', '身体数据'], ['charts', '进度图表']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#fff' : 'var(--text2)'
          }}>{l}</button>
        ))}
      </div>
      {tab === 'log' && <WorkoutLog />}
      {tab === 'metrics' && <BodyMetrics />}
      {tab === 'charts' && <ProgressCharts />}
    </div>
  )
}

function WorkoutLog() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Workout | null>(null)

  async function load() {
    const rows = await dbQuery('SELECT * FROM workouts ORDER BY date DESC')
    const result: Workout[] = []
    for (const w of rows) {
      const sets = await dbQuery('SELECT * FROM workout_sets WHERE workout_id = ?', [w.id])
      result.push({ ...w, sets })
    }
    setWorkouts(result)
  }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM workout_sets WHERE workout_id = ?', [id])
    await dbRun('DELETE FROM workouts WHERE id = ?', [id])
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{workouts.length} 条记录</span>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={btnPrimary}><Plus size={14} /> 新建训练</button>
      </div>
      {workouts.length === 0 ? (
        <EmptyState icon={Dumbbell} text="暂无训练记录" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workouts.map(w => (
            <div key={w.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                {expanded === w.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span style={{ flex: 1, marginLeft: 8, fontWeight: 500 }}>{w.name}</span>
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>{w.date}</span>
                {w.duration_min > 0 && <span style={{ color: 'var(--text3)', fontSize: 13, marginLeft: 12 }}>{w.duration_min}min</span>}
                <span style={{ color: 'var(--text3)', fontSize: 13, marginLeft: 12 }}>{w.sets?.length || 0} 组</span>
                <button onClick={(e) => { e.stopPropagation(); setEditing(w); setShowModal(true) }} style={iconBtn}><Edit3 size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); del(w.id) }} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              {expanded === w.id && w.sets?.length > 0 && (
                <div style={{ padding: '0 16px 12px 40px' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ color: 'var(--text3)' }}>
                      <th style={th}>动作</th><th style={th}>组</th><th style={th}>次数</th><th style={th}>重量kg</th><th style={th}>RPE</th>
                    </tr></thead>
                    <tbody>
                      {w.sets.map((s: any) => (
                        <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={td}>{s.exercise}</td><td style={td}>{s.set_number}</td>
                          <td style={td}>{s.reps}</td><td style={td}>{s.weight_kg}</td><td style={td}>{s.rpe || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {w.notes && <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 8 }}>{w.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && <WorkoutModal workout={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function WorkoutModal({ workout, onClose, onSaved }: { workout: Workout | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(workout?.name || '')
  const [date, setDate] = useState(workout?.date || new Date().toISOString().slice(0, 10))
  const [duration, setDuration] = useState(workout?.duration_min || 0)
  const [notes, setNotes] = useState(workout?.notes || '')
  const [sets, setSets] = useState<any[]>(workout?.sets?.map((s: any) => ({ exercise: s.exercise, set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg, rpe: s.rpe })) || [{ exercise: '', set_number: 1, reps: 10, weight_kg: 0, rpe: 0 }])

  async function save() {
    if (!name.trim()) return
    if (workout) {
      await dbRun('UPDATE workouts SET name=?, date=?, duration_min=?, notes=? WHERE id=?', [name, date, duration, notes, workout.id])
      await dbRun('DELETE FROM workout_sets WHERE workout_id=?', [workout.id])
      for (const s of sets) if (s.exercise) await dbRun('INSERT INTO workout_sets (workout_id, exercise, set_number, reps, weight_kg, rpe) VALUES (?,?,?,?,?,?)', [workout.id, s.exercise, s.set_number, s.reps, s.weight_kg, s.rpe])
    } else {
      const r = await dbRun('INSERT INTO workouts (name, date, duration_min, notes) VALUES (?,?,?,?)', [name, date, duration, notes])
      for (const s of sets) if (s.exercise) await dbRun('INSERT INTO workout_sets (workout_id, exercise, set_number, reps, weight_kg, rpe) VALUES (?,?,?,?,?,?)', [r.id, s.exercise, s.set_number, s.reps, s.weight_kg, s.rpe])
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={workout ? '编辑训练' : '新建训练'}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>训练名称</label>
        <input style={input} placeholder="如：推日、拉日、腿日" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>日期</label>
          <input style={input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>时长（分钟）</label>
          <input style={input} type="number" placeholder="60" value={duration || ''} onChange={e => setDuration(Number(e.target.value) || 0)} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>训练组</div>
        {/* 表头 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 4, fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
          <div style={{ flex: 2 }}>动作名称</div>
          <div style={{ flex: 1, textAlign: 'center' }}>第几组</div>
          <div style={{ flex: 1, textAlign: 'center' }}>次数</div>
          <div style={{ flex: 1, textAlign: 'center' }}>重量(kg)</div>
          <div style={{ flex: 1, textAlign: 'center' }}>RPE(1-10)</div>
          <div style={{ width: 28 }} />
        </div>
        {sets.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <input style={{ ...input, flex: 2, marginBottom: 0 }} placeholder="如：卧推、深蹲、硬拉" value={s.exercise} onChange={e => { const n = [...sets]; n[i].exercise = e.target.value; setSets(n) }} />
            <input style={{ ...input, flex: 1, marginBottom: 0, textAlign: 'center' }} type="number" placeholder="1" value={s.set_number} onChange={e => { const n = [...sets]; n[i].set_number = Number(e.target.value); setSets(n) }} />
            <input style={{ ...input, flex: 1, marginBottom: 0, textAlign: 'center' }} type="number" placeholder="10" value={s.reps} onChange={e => { const n = [...sets]; n[i].reps = Number(e.target.value); setSets(n) }} />
            <input style={{ ...input, flex: 1, marginBottom: 0, textAlign: 'center' }} type="number" placeholder="60" value={s.weight_kg} onChange={e => { const n = [...sets]; n[i].weight_kg = Number(e.target.value); setSets(n) }} />
            <input style={{ ...input, flex: 1, marginBottom: 0, textAlign: 'center' }} type="number" placeholder="7" value={s.rpe || ''} onChange={e => { const n = [...sets]; n[i].rpe = Number(e.target.value); setSets(n) }} />
            <button onClick={() => setSets(sets.filter((_, j) => j !== i))} style={iconBtn}><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => setSets([...sets, { exercise: '', set_number: sets.length + 1, reps: 10, weight_kg: 0, rpe: 0 }])} style={{ ...btnPrimary, marginTop: 4 }}><Plus size={14} /> 添加组</button>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>备注（可选）</label>
        <textarea style={{ ...input, resize: 'none' }} rows={2} placeholder="今天状态如何？有什么感受？" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
      </div>
    </Modal>
  )
}

function BodyMetrics() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  async function load() { setMetrics(await dbQuery('SELECT * FROM body_metrics ORDER BY date DESC')) }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('确定删除？')) return
    await dbRun('DELETE FROM body_metrics WHERE id = ?', [id])
    load()
  }

  const fields = [['weight_kg', '体重kg'], ['body_fat_pct', '体脂%'], ['chest_cm', '胸围cm'], ['waist_cm', '腰围cm'], ['arm_cm', '臂围cm'], ['thigh_cm', '腿围cm']]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{metrics.length} 条记录</span>
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={14} /> 记录数据</button>
      </div>
      {metrics.length === 0 ? <EmptyState icon={Dumbbell} text="暂无身体数据" /> : (
        <div style={{ overflowX: 'auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)' }}>
              <th style={th}>日期</th>
              {fields.map(([k, l]) => <th key={k} style={th}>{l}</th>)}
              <th style={th}>操作</th>
            </tr></thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={td}>{m.date}</td>
                  {fields.map(([k]) => <td key={k} style={td}>{m[k] != null ? m[k] : '-'}</td>)}
                  <td style={td}><button onClick={() => del(m.id)} style={iconBtn}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <MetricModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function MetricModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [vals, setVals] = useState<Record<string, string>>({})
  const fields = ['weight_kg', 'body_fat_pct', 'chest_cm', 'waist_cm', 'arm_cm', 'thigh_cm']

  async function save() {
    const params = [date, ...fields.map(f => vals[f] ? Number(vals[f]) : null)]
    await dbRun('INSERT INTO body_metrics (date, weight_kg, body_fat_pct, chest_cm, waist_cm, arm_cm, thigh_cm) VALUES (?,?,?,?,?,?,?)', params)
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="记录身体数据">
      <input style={input} type="date" value={date} onChange={e => setDate(e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {fields.map(f => <input key={f} style={input} type="number" step="0.1" placeholder={f} value={vals[f] || ''} onChange={e => setVals({ ...vals, [f]: e.target.value })} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={btnSecondary}>取消</button>
        <button onClick={save} style={btnPrimary}>保存</button>
      </div>
    </Modal>
  )
}

function ProgressCharts() {
  const [weightData, setWeightData] = useState<any[]>([])
  const [prData, setPrData] = useState<any[]>([])

  useEffect(() => {
    dbQuery('SELECT date, weight_kg FROM body_metrics WHERE weight_kg IS NOT NULL ORDER BY date').then(setWeightData)
    dbQuery('SELECT exercise, MAX(weight_kg) as max_weight FROM workout_sets GROUP BY exercise ORDER BY max_weight DESC').then(setPrData)
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>体重变化</h3>
        {weightData.length === 0 ? <EmptyState icon={Dumbbell} text="暂无数据" /> : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 150 }}>
            {weightData.slice(-20).map((d, i) => {
              const max = Math.max(...weightData.map(w => w.weight_kg))
              const min = Math.min(...weightData.map(w => w.weight_kg))
              const range = max - min || 1
              const h = ((d.weight_kg - min) / range) * 100 + 20
              return <div key={i} title={`${d.date}: ${d.weight_kg}kg`} style={{ flex: 1, height: `${h}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', minWidth: 8 }} />
            })}
          </div>
        )}
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>个人记录 PR</h3>
        {prData.length === 0 ? <EmptyState icon={Trophy} text="暂无数据" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {prData.map((pr, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>{pr.exercise}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{pr.max_weight}kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 通用组件 ──
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties
const btnSecondary = { padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' } as React.CSSProperties
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', alignItems: 'center' } as React.CSSProperties
const input = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, marginBottom: 8 } as React.CSSProperties
const th = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--text2)' } as React.CSSProperties
const td = { padding: '8px 12px', color: 'var(--text)' } as React.CSSProperties

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
