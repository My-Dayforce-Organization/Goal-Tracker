import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type User = { id: number; name: string; role: string }
type Goal = { id: number; title: string; progress: number; priority: string; status: string }
type Dashboard = { range: string; kpis: { goal_count: number; completion_rate: number; overdue_goals: number; high_priority: number } }

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'
const RANGE_OPTIONS = ['monthly', 'quarterly', 'yearly'] as const

const seededUsers: User[] = [
  { id: 1, name: 'Manager Bob', role: 'manager' },
  { id: 2, name: 'Employee Alice', role: 'employee' },
  { id: 3, name: 'Employee Evan', role: 'employee' },
]

const colors = ['#0ea5e9', '#22c55e', '#f97316', '#ef4444']

function App() {
  const [currentUser, setCurrentUser] = useState<User>(seededUsers[1])
  const [goals, setGoals] = useState<Goal[]>([])
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>('monthly')
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [nlText, setNlText] = useState('I completed reading 12 Rules for Life today')
  const [preview, setPreview] = useState<{ id: number; text: string; confidence: number } | null>(null)
  const [undoTimer, setUndoTimer] = useState<number>(10)
  const [reports, setReports] = useState<User[]>([])

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, options)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function loadGoals(userId: number) {
    const data = await api<Goal[]>(`/users/${userId}/goals?requester_id=${currentUser.id}`)
    setGoals(data.filter((g) => g.status !== 'deleted'))
  }

  async function loadDashboard() {
    const data = await api<Dashboard>(`/dashboard?requester_id=${currentUser.id}&range=${range}`)
    setDashboard(data)
  }

  async function loadReports() {
    if (currentUser.role !== 'manager') {
      setReports([])
      return
    }
    const data = await api<User[]>(`/users/${currentUser.id}/reports?requester_id=${currentUser.id}`)
    setReports(data)
  }

  useEffect(() => {
    loadGoals(currentUser.id).catch(() => setGoals([]))
    loadDashboard().catch(() => setDashboard(null))
    loadReports().catch(() => setReports([]))
  }, [currentUser, range])

  useEffect(() => {
    if (!preview) return
    setUndoTimer(10)
    const handle = window.setInterval(() => setUndoTimer((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => window.clearInterval(handle)
  }, [preview])

  async function createGoal() {
    if (!newGoalTitle.trim()) return
    await api('/goals?requester_id=' + currentUser.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id, title: newGoalTitle, priority: 'medium' }),
    })
    setNewGoalTitle('')
    loadGoals(currentUser.id)
    loadDashboard()
  }

  async function ingestNl() {
    const payload = {
      user_id: currentUser.id,
      client_event_id: `evt-${Date.now()}`,
      text: nlText,
      source: 'web',
    }
    const data = await api<{ nl_event_id: number; preview: string; confidence: number }>('/nl/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'idempotency-token': `idem-${Date.now()}` },
      body: JSON.stringify(payload),
    })
    setPreview({ id: data.nl_event_id, text: data.preview, confidence: data.confidence })
  }

  async function confirmNl(confirm: boolean) {
    if (!preview) return
    await api(`/nl/ingest/${preview.id}/confirm?requester_id=${currentUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm }),
    })
    setPreview(null)
    loadGoals(currentUser.id)
    loadDashboard()
  }

  const monthlyData = useMemo(
    () => goals.map((g) => ({ name: g.title.length > 14 ? g.title.slice(0, 14) + '…' : g.title, progress: g.progress })),
    [goals],
  )

  const statusData = useMemo(() => {
    const active = goals.filter((g) => g.progress < 100).length
    const done = goals.filter((g) => g.progress >= 100).length
    return [
      { name: 'Active', value: active },
      { name: 'Completed', value: done },
    ]
  }, [goals])

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>Goal Tracker Dashboard</h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <label>
          User:
          <select value={currentUser.id} onChange={(e) => setCurrentUser(seededUsers.find((u) => u.id === Number(e.target.value)) || seededUsers[1])} style={{ marginLeft: 8 }}>
            {seededUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </label>
        <label>
          View:
          <select value={range} onChange={(e) => setRange(e.target.value as any)} style={{ marginLeft: 8 }}>
            {RANGE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <section aria-label="kpi cards" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 18 }}>
        <Kpi title="Goals" value={dashboard?.kpis.goal_count ?? goals.length} />
        <Kpi title="Completion %" value={(dashboard?.kpis.completion_rate ?? 0).toFixed(1)} />
        <Kpi title="Overdue" value={dashboard?.kpis.overdue_goals ?? 0} />
        <Kpi title="High Priority" value={dashboard?.kpis.high_priority ?? goals.filter((g) => g.priority === 'high').length} />
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2>Natural language update</h2>
        <textarea value={nlText} onChange={(e) => setNlText(e.target.value)} rows={3} style={{ width: '100%' }} />
        <button onClick={ingestNl}>Parse update</button>
        {preview && (
          <div aria-live="polite" style={{ marginTop: 8, border: '1px solid #ddd', padding: 8, borderRadius: 8 }}>
            <strong>Preview:</strong> {preview.text} (confidence {preview.confidence.toFixed(2)})
            <div style={{ marginTop: 8 }}>
              <button onClick={() => confirmNl(true)}>Confirm</button>{' '}
              <button onClick={() => confirmNl(false)}>Discard</button>{' '}
              <span>Undo buffer: {undoTimer}s</span>
            </div>
          </div>
        )}
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr', marginBottom: 18 }}>
        <div style={{ height: 280, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ height: 280, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90}>
                {statusData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2>Goals</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="New goal title" />
          <button onClick={createGoal}>Add goal</button>
        </div>
        <ul>
          {goals.map((goal) => (
            <li key={goal.id} style={{ marginBottom: 8 }}>
              <strong>{goal.title}</strong> — {goal.progress}% — {goal.priority}
            </li>
          ))}
        </ul>
      </section>

      {currentUser.role === 'manager' && (
        <section>
          <h2>Direct reports</h2>
          <ul>{reports.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
        </section>
      )}
    </main>
  )
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, background: '#fafafa' }}>
      <div style={{ fontSize: 12, color: '#64748b' }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)