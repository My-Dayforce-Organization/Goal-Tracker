import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

type Priority = 'high' | 'medium' | 'low'
type Status = 'behind' | 'on-track' | 'ahead'
type TabKey = 'dashboard' | 'plan' | 'systems' | 'add'

type Milestone = {
  id: number
  title: string
  priority: Priority
  status: Status
  category: string
  timeline: string
  progress: number
  target: number
  daysLeft: number
  description: string
}

const initialMilestones: Milestone[] = [
  {
    id: 1,
    title: 'Learn a Programming Language',
    priority: 'high',
    status: 'behind',
    category: 'Learning',
    timeline: 'Q1 - Q2',
    progress: 34,
    target: 48,
    daysLeft: 103,
    description: 'Complete one project-based path and ship two public mini apps.',
  },
  {
    id: 2,
    title: 'Read 25 books',
    priority: 'medium',
    status: 'on-track',
    category: 'Personal Growth',
    timeline: 'Full Year',
    progress: 41,
    target: 40,
    daysLeft: 282,
    description: 'Focus on leadership, product strategy, and communication.',
  },
  {
    id: 3,
    title: 'Find a Consultant role in a diff…',
    priority: 'high',
    status: 'behind',
    category: 'Career',
    timeline: 'Q2 - Q3',
    progress: 26,
    target: 45,
    daysLeft: 173,
    description: 'Build portfolio proof, refine pitch, and apply weekly.',
  },
  {
    id: 4,
    title: 'Run a marathon',
    priority: 'medium',
    status: 'on-track',
    category: 'Fitness',
    timeline: 'Q3 - Q4',
    progress: 59,
    target: 55,
    daysLeft: 210,
    description: 'Follow a progressive 20-week running plan and recovery schedule.',
  },
  {
    id: 5,
    title: 'Maintain personal health',
    priority: 'low',
    status: 'ahead',
    category: 'Health',
    timeline: 'Full Year',
    progress: 68,
    target: 62,
    daysLeft: 282,
    description: 'Keep sleep, hydration, and mobility habits above 85% compliance.',
  },
]

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: '◉' },
  { key: 'plan', label: 'My Plan', icon: '✓' },
  { key: 'systems', label: 'My Systems', icon: '∞' },
  { key: 'add', label: 'Add', icon: '+' },
]

const priorityMeta: Record<Priority, { label: string; color: string; accent: string }> = {
  high: { label: 'High', color: 'var(--danger)', accent: 'var(--danger-soft)' },
  medium: { label: 'Medium', color: 'var(--warning)', accent: 'var(--warning-soft)' },
  low: { label: 'Low', color: 'var(--success)', accent: 'var(--success-soft)' },
}

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [darkMode, setDarkMode] = useState(true)
  const [milestones, setMilestones] = useState(initialMilestones)

  const [newMilestone, setNewMilestone] = useState({
    title: '',
    startDate: '',
    description: '',
    category: 'Career',
    timeline: 'Q2 - Q3',
    priority: 'medium' as Priority,
  })

  const summary = useMemo(() => {
    const high = milestones.filter((m) => m.priority === 'high').length
    const medium = milestones.filter((m) => m.priority === 'medium').length
    const low = milestones.filter((m) => m.priority === 'low').length
    const total = high + medium + low || 1
    return {
      high,
      medium,
      low,
      slices: [
        { label: 'High Priority', value: Math.round((high / total) * 100), color: 'var(--danger)' },
        { label: 'Medium Priority', value: Math.round((medium / total) * 100), color: 'var(--warning)' },
        { label: 'Low Priority', value: Math.round((low / total) * 100), color: 'var(--success)' },
      ],
    }
  }, [milestones])

  const onAddMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMilestone.title.trim() || !newMilestone.description.trim()) return

    const next: Milestone = {
      id: milestones.length + 1,
      title: newMilestone.title,
      category: newMilestone.category,
      timeline: newMilestone.timeline,
      priority: newMilestone.priority,
      status: 'on-track',
      progress: 0,
      target: 8,
      daysLeft: 300,
      description: newMilestone.description,
    }

    setMilestones((prev) => [next, ...prev])
    setActiveTab('plan')
    setNewMilestone({
      title: '',
      startDate: '',
      description: '',
      category: 'Career',
      timeline: 'Q2 - Q3',
      priority: 'medium',
    })
  }

  return (
    <div className={classNames('app-shell', darkMode ? 'theme-dark' : 'theme-light')}>
      <div className="gradient-bg" />
      <main className="container">
        <header className="header-card panel">
          <div>
            <h1>2026 Plan</h1>
            <p>Saved to local device</p>
          </div>
          <div className="header-actions" aria-label="top actions">
            <button type="button" className="icon-btn" onClick={() => setDarkMode((v) => !v)}>
              {darkMode ? '☀︎' : '☾'}
            </button>
            <button type="button" className="icon-btn">👤</button>
            <button type="button" className="icon-btn">⚙︎</button>
          </div>
        </header>

        <nav className="tabs panel">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={classNames('tab-btn', activeTab === tab.key && 'tab-btn-active')}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
          <section className="grid-layout">
            <article className="panel overview">
              <h2>Yearly Overview</h2>
              <p>Interactive analytics of your milestones.</p>
              <div className="analytics-grid">
                <DonutCard slices={summary.slices} />
                <div className="summary-stack">
                  <SummaryCard title="High Priority" subtitle="Critical outcomes" count={summary.high} tone="high" />
                  <SummaryCard title="Medium Priority" subtitle="Steady focus" count={summary.medium} tone="medium" />
                  <SummaryCard title="Low Priority" subtitle="Maintenance goals" count={summary.low} tone="low" />
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>Goal Progress Tracker</h3>
              <p className="muted">Tap any milestone to expand details.</p>
              <div className="milestone-list">
                {milestones.slice(0, 4).map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'plan' && (
          <section className="panel">
            <h3>My Plan</h3>
            <p className="muted">Track each milestone by progress, timeline, and category.</p>
            <div className="milestone-list">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'systems' && (
          <section className="panel systems-grid">
            <article className="stat-box">
              <h4>Weekly Review System</h4>
              <p>Every Sunday: review progress, rebalance priorities, and schedule next actions.</p>
              <span>Streak: 8 weeks</span>
            </article>
            <article className="stat-box">
              <h4>Execution Quality</h4>
              <p>Completion trend remains healthy with 74% planned actions completed on time.</p>
              <span>Trend: +6% this month</span>
            </article>
            <article className="stat-box">
              <h4>Category Balance</h4>
              <p>Career and learning are the most active categories. Health goals are stable.</p>
              <span>Balance score: 82 / 100</span>
            </article>
          </section>
        )}

        {activeTab === 'add' && (
          <section className="panel">
            <h3>Add New 2026 Milestone</h3>
            <p className="muted">Capture the goal clearly so your plan can track and prioritize it.</p>
            <form className="form-grid" onSubmit={onAddMilestone}>
              <Field label="Specific Milestone">
                <input
                  placeholder="Example: Build a data analytics side project"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Field>

              <Field label="Start Date">
                <input
                  type="date"
                  value={newMilestone.startDate}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </Field>

              <Field label="Description (Context for AI)">
                <textarea
                  rows={4}
                  placeholder="Add why this milestone matters, blockers, and what success looks like."
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Field>

              <Field label="Category">
                <select value={newMilestone.category} onChange={(e) => setNewMilestone((prev) => ({ ...prev, category: e.target.value }))}>
                  <option>Career</option>
                  <option>Learning</option>
                  <option>Health</option>
                  <option>Personal Growth</option>
                </select>
              </Field>

              <div className="split-2">
                <Field label="Timeline">
                  <select value={newMilestone.timeline} onChange={(e) => setNewMilestone((prev) => ({ ...prev, timeline: e.target.value }))}>
                    <option>&lt; 3 months</option>
                    <option>Q2 - Q3</option>
                    <option>Q3 - Q4</option>
                    <option>Full Year</option>
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={newMilestone.priority}
                    onChange={(e) => setNewMilestone((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
              </div>

              <button type="submit" className="submit-btn">Add Milestone</button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ title, subtitle, count, tone }: { title: string; subtitle: string; count: number; tone: Priority }) {
  return (
    <div className={classNames('summary-card', `tone-${tone}`)}>
      <div>
        <h4>{title}</h4>
        <p>{subtitle}</p>
      </div>
      <strong>{count}</strong>
    </div>
  )
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className={classNames('milestone-card', `tone-${milestone.priority}`)}>
      <div className="row between">
        <div className="row wrap">
          <span className={classNames('badge', `status-${milestone.status}`)}>{milestone.status === 'behind' ? 'Behind' : milestone.status === 'ahead' ? 'Ahead' : 'On Track'}</span>
          <span className={classNames('badge', `priority-${milestone.priority}`)}>{priorityMeta[milestone.priority].label}</span>
        </div>
        <button type="button" className="icon-btn edit">✎</button>
      </div>

      <h4>{milestone.title}</h4>

      <div className="row between compact">
        <span className="muted-strong">{milestone.daysLeft} days left</span>
        <span>Progress {milestone.progress}%</span>
        <span>Target {milestone.target}%</span>
      </div>

      <div className="progress-track">
        <span style={{ width: `${milestone.progress}%` }} />
      </div>
      <div className="target-line" style={{ left: `${milestone.target}%` }} />

      <div className="row between compact meta-row">
        <span>{milestone.category}</span>
        <span>{milestone.timeline}</span>
      </div>

      <button type="button" className="expand-btn" onClick={() => setExpanded((v) => !v)}>
        <span>{expanded ? 'Hide details' : 'Show details'}</span>
        <span className={classNames('chevron', expanded && 'open')}>⌄</span>
      </button>

      {expanded && <p className="expanded-text">{milestone.description}</p>}
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function DonutCard({ slices }: { slices: Array<{ label: string; value: number; color: string }> }) {
  const donutGradient = `conic-gradient(${slices
    .map((slice, i) => {
      const start = slices.slice(0, i).reduce((acc, s) => acc + s.value, 0)
      const end = start + slice.value
      return `${slice.color} ${start}% ${end}%`
    })
    .join(', ')})`

  return (
    <article className="donut-card">
      <h4>Category Distribution</h4>
      <div className="donut-wrap">
        <div className="donut" style={{ background: donutGradient }}>
          <span>2026</span>
        </div>
        <ul>
          {slices.map((slice) => (
            <li key={slice.label}>
              <span className="dot" style={{ background: slice.color }} />
              <span>{slice.label}</span>
              <strong>{slice.value}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
