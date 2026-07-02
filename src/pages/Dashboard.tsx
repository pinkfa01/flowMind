import { Link } from 'react-router-dom'
import { Dumbbell, BookOpen, Atom, BookMarked } from 'lucide-react'

const modules = [
  { path: '/fitness', title: '健身记录', desc: '训练日志、身体数据', icon: Dumbbell, color: '#4c6ef5' },
  { path: '/english', title: '英语学习', desc: '单词本、每日打卡、笔记', icon: BookOpen, color: '#34c759' },
  { path: '/reading', title: '读书', desc: '书籍管理与阅读进度', icon: BookMarked, color: '#a855f7' },
  { path: '/physics-ai', title: '物理AI研究', desc: '投资笔记、行业动态、标的追踪', icon: Atom, color: '#ff9500' },
]

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Welcome to FlowMind</h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 24px' }}>你的个人 AI 工作台</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {modules.map(m => (
          <Link key={m.path} to={m.path} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20,
              cursor: 'pointer', transition: 'transform 0.15s'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: m.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <m.icon size={22} color={m.color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>{m.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
