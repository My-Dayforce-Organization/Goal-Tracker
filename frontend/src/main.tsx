import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

type Priority = 'high' | 'medium' | 'low'

type GoalCard = {
  id: number
  title: string
  priority: Priority
  category: string
  timeline: string
  progress: number
  daysLeft: number
  behindBy: number
}

const goals: GoalCard[] = [
  { id: 1, title: 'Learn a Programming Language', priority: 'high', category: 'Learning', timeline: '3 - 6 months', progress: 0, daysLeft: 108, behindBy: 40 },
  { id: 2, title: 'Read 25 books', priority: 'medium', category: 'Personal', timeline: '1 year', progress: 0, daysLeft: 293, behindBy: 20 },
  { id: 3, title: 'Launch consulting profile', priority: 'medium', category: 'Work', timeline: '< 3 months', progress: 22, daysLeft: 54, behindBy: 10 },
  { id: 4, title: 'Improve cardio health', priority: 'low', category: 'Health', timeline: '6 months', progress: 72, daysLeft: 146, behindBy: 0 },
]

const badgeGradient: Record<Priority, string> = {
  high: 'linear-gradient(135deg, #ff3d5a, #db2cb8)',
  medium: 'linear-gradient(135deg, #ffcd29, #ff7a18)',
  low: 'linear-gradient(135deg, #36d399, #18b6c9)',
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plan' | 'systems' | 'add'>('dashboard')

  const counts = useMemo(() => {
    const high = goals.filter((g) => g.priority === 'high').length
    const medium = goals.filter((g) => g.priority === 'medium').length
    const low = goals.filter((g) => g.priority === 'low').length
    return { high, medium, low }
  }, [])

  return (
    <main style={styles.page}>
      <div style={styles.phoneShell}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>2026 Plan</h1>
            <p style={styles.sub}>💾 Saved to local device</p>
          </div>
          <div style={styles.icons}>☀️ 👤 ⚙️</div>
        </header>

        <nav style={styles.nav}>
          {[
            ['dashboard', 'Dashboard'],
            ['plan', 'My Plan'],
            ['systems', 'My Systems'],
            ['add', 'Add'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id as any)} style={{ ...styles.tabBtn, ...(activeTab === id ? styles.tabBtnActive : {}) }}>
              {label}
            </button>
          ))}
        </nav>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Yearly Overview</h2>
          <p style={styles.sub}>Interactive analytics of your milestones.</p>

          <div style={{ ...styles.priorityCard, background: badgeGradient.high }}>
            <div>
              <strong style={styles.priorityTitle}>High Priority</strong>
              <p style={styles.prioritySubtitle}>Must achieve goals</p>
              <span style={styles.pill}>VIEW DETAILS</span>
            </div>
            <span style={styles.priorityCount}>{counts.high}</span>
          </div>

          <div style={{ ...styles.priorityCard, background: badgeGradient.medium }}>
            <div>
              <strong style={styles.priorityTitle}>Medium Priority</strong>
              <p style={styles.prioritySubtitle}>Steady progress needed</p>
              <span style={styles.pill}>VIEW DETAILS</span>
            </div>
            <span style={styles.priorityCount}>{counts.medium}</span>
          </div>

          <div style={{ ...styles.priorityCard, background: badgeGradient.low }}>
            <div>
              <strong style={styles.priorityTitle}>Low Priority</strong>
              <p style={styles.prioritySubtitle}>Good to have</p>
              <span style={styles.pill}>VIEW DETAILS</span>
            </div>
            <span style={styles.priorityCount}>{counts.low}</span>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Goal Progress Tracker</h2>
          {goals.map((goal) => (
            <article key={goal.id} style={styles.goalCard}>
              <div style={styles.goalTopRow}>
                <span style={styles.behind}>↘ Behind</span>
                <span style={styles.priorityChip}>{goal.priority}</span>
                <span style={styles.daysLeft}>{goal.daysLeft} days left</span>
              </div>
              <h3 style={styles.goalTitle}>{goal.title}</h3>
              <div style={styles.goalTopRow}>
                <span style={styles.progressLabel}>PROGRESS {goal.progress}%</span>
                <span style={styles.progressLag}>-{goal.behindBy}% Behind</span>
              </div>
              <div style={styles.track}><div style={{ ...styles.fill, width: `${goal.progress}%` }} /></div>
              <p style={styles.meta}>{goal.category} • {goal.timeline}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 10% 20%, #09203f 0%, #020617 45%, #01030a 100%)',
    color: '#e2e8f0',
    padding: 20,
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
  },
  phoneShell: { maxWidth: 860, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 14px', borderBottom: '1px solid #1e293b' },
  title: { margin: 0, fontSize: 46, fontWeight: 800, background: 'linear-gradient(90deg,#0ea5e9,#ec4899)', WebkitBackgroundClip: 'text', color: 'transparent' },
  sub: { margin: '6px 0 0', color: '#94a3b8' },
  icons: { fontSize: 24, letterSpacing: 8 },
  nav: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '18px 0' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 14, padding: '12px 10px', fontWeight: 700 },
  tabBtnActive: { background: '#0ea5e9', color: '#f8fafc' },
  panel: { background: 'rgba(2, 6, 23, 0.72)', border: '1px solid #233047', borderRadius: 20, padding: 18, marginBottom: 16, boxShadow: '0 20px 45px rgba(14, 165, 233, 0.12)' },
  panelTitle: { margin: '0 0 8px', fontSize: 40, color: '#f8fafc' },
  priorityCard: { borderRadius: 24, padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginTop: 12 },
  priorityTitle: { fontSize: 30, display: 'block' },
  prioritySubtitle: { margin: '6px 0 12px', fontSize: 24, opacity: 0.95 },
  priorityCount: { fontSize: 64, fontWeight: 800 },
  pill: { display: 'inline-block', borderRadius: 999, padding: '8px 16px', fontSize: 17, fontWeight: 700, background: 'rgba(255,255,255,0.24)' },
  goalCard: { border: '1px solid #334155', borderLeft: '6px solid #ff4d79', borderRadius: 18, padding: 14, marginBottom: 12, background: 'rgba(5, 10, 32, 0.95)' },
  goalTopRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  behind: { background: '#4c1026', color: '#fda4af', border: '1px solid #9f1239', borderRadius: 999, padding: '4px 10px', fontSize: 14, fontWeight: 700 },
  priorityChip: { background: '#3f2b0f', color: '#fcd34d', border: '1px solid #78350f', borderRadius: 999, padding: '4px 10px', textTransform: 'capitalize', fontWeight: 700 },
  daysLeft: { marginLeft: 'auto', color: '#cbd5e1', background: '#1e293b', borderRadius: 10, padding: '6px 10px', fontWeight: 700 },
  goalTitle: { fontSize: 34, margin: '12px 0', color: '#e2e8f0' },
  progressLabel: { fontSize: 22, fontWeight: 700 },
  progressLag: { color: '#fb7185', fontWeight: 700 },
  track: { marginTop: 10, height: 12, background: '#1f2e48', borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#22d3ee)' },
  meta: { margin: '10px 0 0', color: '#94a3b8', fontSize: 18 },
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)