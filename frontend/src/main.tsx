import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

type Priority = 'high' | 'medium' | 'low'
type Tab = 'dashboard' | 'plan' | 'systems' | 'add'

type GoalItem = {
  id: number
  title: string
  priority: Priority
  category: string
  timeline: string
  progress: number
  daysLeft: number
  behindBy: number
}

const initialGoals: GoalItem[] = [
  { id: 1, title: 'Learn a Programming Language', priority: 'high', category: 'Learning', timeline: '3 - 6 months', progress: 0, daysLeft: 108, behindBy: 40 },
  { id: 2, title: 'Read 25 books', priority: 'medium', category: 'Personal', timeline: '1 year', progress: 0, daysLeft: 293, behindBy: 20 },
  { id: 3, title: 'Find a consultant role in a different country', priority: 'high', category: 'Work', timeline: '< 3 months', progress: 12, daysLeft: 90, behindBy: 28 },
  { id: 4, title: 'Improve cardio health', priority: 'low', category: 'Health', timeline: '6 months', progress: 72, daysLeft: 146, behindBy: 0 },
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [goals, setGoals] = useState(initialGoals)
  const [form, setForm] = useState({ title: '', startDate: '2026-03-13', description: '', category: 'Work', timeline: '<3 months', priority: 'medium' as Priority })

  const summary = useMemo(() => {
    const high = goals.filter((g) => g.priority === 'high').length
    const medium = goals.filter((g) => g.priority === 'medium').length
    const low = goals.filter((g) => g.priority === 'low').length
    return { high, medium, low }
  }, [goals])

  function addMilestone() {
    if (!form.title.trim()) return
    const next: GoalItem = {
      id: goals.length + 1,
      title: form.title,
      priority: form.priority,
      category: form.category,
      timeline: form.timeline,
      progress: 0,
      daysLeft: 120,
      behindBy: 0,
    }
    setGoals((prev) => [next, ...prev])
    setForm((prev) => ({ ...prev, title: '', description: '' }))
    setActiveTab('dashboard')
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={styles.iconBox}>📅</div>
            <div>
              <h1 style={styles.brand}>2026 Plan</h1>
              <p style={styles.metaText}>💾 Saved to local device</p>
            </div>
          </div>
          <div style={styles.headerIcons}>☀️ 👤 ⚙️</div>
        </header>

        <nav style={styles.navWrap}>
          {([
            ['dashboard', 'Dashboard'],
            ['plan', 'My Plan'],
            ['systems', 'My Systems'],
            ['add', 'Add'],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && <DashboardView goals={goals} summary={summary} />}
        {activeTab === 'plan' && <GoalCards goals={goals} />}
        {activeTab === 'systems' && <SystemsView />}
        {activeTab === 'add' && <AddMilestoneForm form={form} setForm={setForm} onSubmit={addMilestone} />}
      </section>
    </main>
  )
}

function DashboardView({ goals, summary }: { goals: GoalItem[]; summary: { high: number; medium: number; low: number } }) {
  return (
    <>
      <section style={styles.panel}>
        <h2 style={styles.heading}>Yearly Overview</h2>
        <p style={styles.metaText}>Interactive analytics of your {goals.length} milestones.</p>

        <div style={styles.donutPanel}>
          <h3 style={styles.sectionHeading}>Category Distribution</h3>
          <div style={styles.donut}>
            <div style={styles.donutHole} />
          </div>
        </div>

        <PriorityCard label='High Priority' subtitle='Must achieve goals' count={summary.high} gradient='linear-gradient(135deg,#ff3d5a,#db2cb8)' />
        <PriorityCard label='Medium Priority' subtitle='Steady progress needed' count={summary.medium} gradient='linear-gradient(135deg,#ffcd29,#ff7a18)' />
        <PriorityCard label='Low Priority' subtitle='Good to have' count={summary.low} gradient='linear-gradient(135deg,#36d399,#18b6c9)' />
      </section>

      <section style={styles.panel}>
        <h3 style={styles.sectionHeading}>Goal Progress Tracker</h3>
        <GoalCards goals={goals.slice(0, 3)} />
      </section>
    </>
  )
}

function GoalCards({ goals }: { goals: GoalItem[] }) {
  return (
    <>
      {goals.map((goal) => (
        <article key={goal.id} style={styles.goalCard}>
          <div style={styles.goalTopRow}>
            <span style={styles.behindBadge}>↘ Behind</span>
            <span style={styles.priorityBadge}>{goal.priority}</span>
            <span style={styles.days}>{goal.daysLeft} days left</span>
          </div>
          <h4 style={styles.goalTitle}>{goal.title}</h4>
          <div style={styles.goalTopRow}>
            <strong style={styles.progressLabel}>PROGRESS {goal.progress}%</strong>
            <span style={styles.behindText}>-{goal.behindBy}% Behind</span>
          </div>
          <div style={styles.track}><div style={{ ...styles.fill, width: `${goal.progress}%` }} /></div>
          <p style={styles.metaText}>{goal.category} • {goal.timeline}</p>
        </article>
      ))}
    </>
  )
}

function SystemsView() {
  return (
    <section style={styles.panel}>
      <h2 style={styles.heading}>My Systems</h2>
      <p style={styles.metaText}>Suggested systems to help goal completion:</p>
      <ul style={styles.list}>
        <li>Daily 30-minute deep work block</li>
        <li>Weekly manager sync + milestone review</li>
        <li>Sunday planning checklist template</li>
      </ul>
    </section>
  )
}

function AddMilestoneForm({
  form,
  setForm,
  onSubmit,
}: {
  form: { title: string; startDate: string; description: string; category: string; timeline: string; priority: Priority }
  setForm: React.Dispatch<React.SetStateAction<{ title: string; startDate: string; description: string; category: string; timeline: string; priority: Priority }>>
  onSubmit: () => void
}) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.heading}>+ Add New 2026 Milestone</h2>
      <label style={styles.label}>Specific Milestone</label>
      <input style={styles.input} value={form.title} placeholder='e.g., Launch a personal blog' onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />

      <label style={styles.label}>Start Date</label>
      <input type='date' style={styles.input} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />

      <label style={styles.label}>Description (Context for AI)</label>
      <textarea style={styles.textarea} rows={3} value={form.description} placeholder='Provide details about your goal so the AI can create a better plan...' onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

      <label style={styles.label}>Category</label>
      <select style={styles.input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
        <option>Work</option><option>Personal</option><option>Learning</option><option>Health</option>
      </select>

      <label style={styles.label}>Timeline</label>
      <select style={styles.input} value={form.timeline} onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}>
        <option>&lt;3 months</option><option>3 - 6 months</option><option>1 year</option>
      </select>

      <label style={styles.label}>Priority</label>
      <select style={styles.input} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}>
        <option value='high'>High</option><option value='medium'>Medium</option><option value='low'>Low</option>
      </select>

      <button style={styles.submitBtn} onClick={onSubmit}>Create Milestone</button>
    </section>
  )
}

function PriorityCard({ label, subtitle, count, gradient }: { label: string; subtitle: string; count: number; gradient: string }) {
  return (
    <div style={{ ...styles.priorityCard, background: gradient }}>
      <div>
        <strong style={styles.priorityTitle}>{label}</strong>
        <p style={styles.prioritySub}>{subtitle}</p>
        <span style={styles.detailsBtn}>VIEW DETAILS</span>
      </div>
      <span style={styles.priorityCount}>{count}</span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'radial-gradient(circle at 15% 20%, #05193d 0%, #03091f 40%, #01030a 100%)', color: '#e2e8f0', padding: 20, fontFamily: 'Inter, Arial, sans-serif' },
  shell: { maxWidth: 860, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #243447', paddingBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', display: 'grid', placeItems: 'center', fontSize: 24 },
  brand: { margin: 0, fontSize: 50, fontWeight: 800, background: 'linear-gradient(90deg,#0ea5e9,#ec4899)', WebkitBackgroundClip: 'text', color: 'transparent' },
  metaText: { margin: '4px 0 0', color: '#9fb2ca', fontSize: 24 },
  headerIcons: { fontSize: 24, letterSpacing: 8 },
  navWrap: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14, padding: 8, borderRadius: 18, background: '#101b33', border: '1px solid #233047' },
  tab: { border: 'none', background: 'transparent', color: '#8ea0bd', padding: '10px 8px', borderRadius: 12, fontSize: 18, fontWeight: 700 },
  tabActive: { background: '#0ea5e9', color: '#fff' },
  panel: { background: 'rgba(1, 10, 32, 0.8)', border: '1px solid #263a53', borderRadius: 24, padding: 16, marginBottom: 16, boxShadow: '0 16px 40px rgba(56, 189, 248, 0.14)' },
  heading: { margin: '0 0 8px', fontSize: 58, color: '#f8fafc' },
  sectionHeading: { margin: '0 0 12px', fontSize: 48 },
  donutPanel: { border: '1px solid #2a3d59', borderRadius: 20, padding: 14, marginBottom: 12 },
  donut: { width: 260, height: 260, margin: '10px auto', borderRadius: '50%', background: 'conic-gradient(#0ea5e9 0% 22%, #22d3ee 22% 44%, #f43f5e 44% 68%, #6366f1 68% 100%)', display: 'grid', placeItems: 'center' },
  donutHole: { width: 130, height: 130, borderRadius: '50%', background: '#040b1f' },
  priorityCard: { borderRadius: 24, padding: 18, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' },
  priorityTitle: { fontSize: 42 },
  prioritySub: { margin: '4px 0 12px', fontSize: 28 },
  detailsBtn: { fontSize: 20, fontWeight: 700, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.24)' },
  priorityCount: { fontSize: 74, fontWeight: 800 },
  goalCard: { border: '1px solid #31455f', borderLeft: '6px solid #ff4d79', borderRadius: 18, background: '#040e26', padding: 14, marginBottom: 10 },
  goalTopRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  behindBadge: { borderRadius: 999, padding: '4px 10px', background: '#4c1026', color: '#fb7185', border: '1px solid #9f1239', fontSize: 15, fontWeight: 700 },
  priorityBadge: { borderRadius: 999, padding: '4px 10px', background: '#3f2b0f', color: '#fcd34d', border: '1px solid #78350f', textTransform: 'capitalize', fontWeight: 700 },
  days: { marginLeft: 'auto', borderRadius: 10, background: '#15233b', color: '#cbd5e1', padding: '6px 10px', fontWeight: 700 },
  goalTitle: { margin: '10px 0', fontSize: 44 },
  progressLabel: { fontSize: 22 },
  behindText: { color: '#fb7185', fontWeight: 700 },
  track: { height: 12, borderRadius: 999, background: '#22334f', marginTop: 8 },
  fill: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#0ea5e9,#22d3ee)' },
  list: { margin: 0, paddingLeft: 18, fontSize: 22, color: '#d8e4f4', lineHeight: 1.8 },
  label: { display: 'block', marginTop: 12, marginBottom: 6, fontSize: 24, color: '#cbd5e1' },
  input: { width: '100%', borderRadius: 14, border: '1px solid #4b5f7c', background: '#334155', color: '#e5e7eb', padding: '12px 14px', fontSize: 28, boxSizing: 'border-box' },
  textarea: { width: '100%', borderRadius: 14, border: '1px solid #4b5f7c', background: '#334155', color: '#e5e7eb', padding: '12px 14px', fontSize: 28, boxSizing: 'border-box' },
  submitBtn: { marginTop: 16, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: '#fff', padding: '14px 18px', fontSize: 24, fontWeight: 700 },
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
