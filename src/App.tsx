import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, BookOpen, Atom, BookMarked, CalendarDays, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Fitness from './pages/Fitness'
import English from './pages/English'
import PhysicsAI from './pages/PhysicsAI'
import Reading from './pages/Reading'
import Journal from './pages/Journal'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/fitness', label: '健身', icon: Dumbbell },
  { path: '/english', label: '英语', icon: BookOpen },
  { path: '/reading', label: '读书', icon: BookMarked },
  { path: '/journal', label: '日记', icon: CalendarDays },
  { path: '/physics-ai', label: '物理AI', icon: Atom },
]

function Sidebar() {
  const loc = useLocation()
  return (
    <div style={{ width: 200, background: 'var(--card)', borderRight: '1px solid var(--border)', padding: '16px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 20px', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>FlowMind</div>
      {navItems.map(item => {
        const active = loc.pathname === item.path
        return (
          <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
              color: active ? 'var(--accent)' : 'var(--text2)',
              fontWeight: active ? 600 : 400, fontSize: 14,
              background: active ? 'rgba(76,110,245,0.08)' : 'transparent',
              borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent'
            }}>
              <item.icon size={18} /> {item.label}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function Header({ dark, toggleDark }) {
  return (
    <div style={{
      height: 48, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 20px', background: 'var(--card)', borderBottom: '1px solid var(--border)', flexShrink: 0,
      WebkitAppRegion: 'drag'
    } as any}>
      <button onClick={toggleDark} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)',
        WebkitAppRegion: 'no-drag'
      } as any}>
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('fm_dark') === '1')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('fm_dark', dark ? '1' : '0')
  }, [dark])

  return (
    <HashRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header dark={dark} toggleDark={() => setDark(!dark)} />
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/fitness" element={<Fitness />} />
              <Route path="/english" element={<English />} />
              <Route path="/reading" element={<Reading />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/physics-ai" element={<PhysicsAI />} />
            </Routes>
          </div>
        </div>
      </div>
    </HashRouter>
  )
}
