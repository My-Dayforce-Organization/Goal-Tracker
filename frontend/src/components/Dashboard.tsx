import { FormEvent, useEffect, useState } from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Dashboard as DashboardType, Milestone } from '../types';

const COLORS = ['#16a34a', '#dc2626', '#0ea5e9'];

type MilestoneDraft = {
  title: string;
  description: string;
  due_date: string;
  progress: number;
  status: string;
};

export const Dashboard = () => {
  const { auth, logout } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MilestoneDraft>>({});
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [nlText, setNlText] = useState('Update milestone m_emp1_1 to 65%');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const buildDrafts = (items: Milestone[]) => {
    const next: Record<string, MilestoneDraft> = {};
    items.forEach((m) => {
      next[m.id] = {
        title: m.title,
        description: m.description,
        due_date: m.due_date.slice(0, 10),
        progress: m.progress,
        status: m.status,
      };
    });
    setDrafts(next);
  };

  const load = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      const milestoneUserId = auth.role === 'manager' ? 'u_emp_1' : auth.userId;
      const [{ data: milestoneData }, { data: dashboardData }] = await Promise.all([
        api.get(`/users/${milestoneUserId}/milestones`),
        api.get('/dashboard'),
      ]);
      setMilestones(milestoneData);
      buildDrafts(milestoneData);
      setDashboard(dashboardData);
    } catch {
      setError('Could not load dashboard data. Verify backend is reachable and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [auth?.userId]);

  const patchDraft = (milestoneId: string, key: keyof MilestoneDraft, value: string | number) => {
    setDrafts((prev) => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        [key]: value,
      },
    }));
  };

  const saveMilestone = async (milestoneId: string) => {
    const draft = drafts[milestoneId];
    if (!draft) return;
    try {
      await api.put(`/milestones/${milestoneId}`, {
        title: draft.title,
        description: draft.description,
        due_date: new Date(draft.due_date).toISOString(),
        progress: Number(draft.progress),
        status: draft.status,
      });
      await load();
    } catch {
      setError('Failed to save milestone changes.');
    }
  };

  const createMilestone = async () => {
    if (!auth) return;
    try {
      await api.post('/milestones', {
        user_id: auth.role === 'manager' ? 'u_emp_1' : auth.userId,
        title: `New milestone ${new Date().toLocaleTimeString()}`,
        description: 'Created from demo UI',
        due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        progress: 0,
      });
      await load();
    } catch {
      setError('Failed to create milestone.');
    }
  };

  const submitNl = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    try {
      const targetUser = auth.role === 'manager' ? 'u_emp_1' : auth.userId;
      await api.post('/nl/ingest', {
        user_id: targetUser,
        client_event_id: `ui-${Date.now()}`,
        text: nlText,
      });
      await load();
    } catch {
      setError('Failed to process natural language update.');
    }
  };

  if (!auth) return null;

  if (loading) return <div className="min-h-screen p-6 text-slate-600">Loading dashboard…</div>;

  if (error) {
    return (
      <div className="min-h-screen p-6 space-y-3">
        <h1 className="text-xl font-semibold">Dashboard unavailable</h1>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-slate-600">Backend docs: <a className="underline" href="/api/docs" target="_blank" rel="noreferrer">/api/docs</a></p>
        <button onClick={load} className="bg-blue-600 text-white px-3 py-2 rounded">Retry</button>
      </div>
    );
  }

  if (!dashboard) return null;

  const pieData = [
    { name: 'Completed', value: dashboard.completed_milestones },
    { name: 'Overdue', value: dashboard.overdue_milestones },
    { name: 'In Progress', value: Math.max(dashboard.total_milestones - dashboard.completed_milestones - dashboard.overdue_milestones, 0) },
  ];

  const barData = Object.entries(dashboard.by_employee).map(([userId, d]) => ({ userId, progress: d.avg_progress }));

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Welcome, {auth.name}</h1>
          <p className="text-sm text-slate-500 capitalize">Role: {auth.role}</p>
        </div>
        <button onClick={logout} className="bg-slate-700 text-white px-3 py-2 rounded">Logout</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi title="Total" value={dashboard.total_milestones} />
        <Kpi title="Completed" value={dashboard.completed_milestones} />
        <Kpi title="Overdue" value={dashboard.overdue_milestones} />
        <Kpi title="Avg Progress" value={`${dashboard.average_progress}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl p-4 shadow h-72">
          <h2 className="font-semibold mb-2">Milestone Status</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-white rounded-xl p-4 shadow h-72">
          <h2 className="font-semibold mb-2">Avg Progress by Employee</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barData}>
              <XAxis dataKey="userId" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="bg-white rounded-xl p-4 shadow space-y-3">
        <div className="flex justify-between">
          <h2 className="font-semibold">Milestones</h2>
          <button onClick={createMilestone} className="bg-green-600 text-white px-3 py-1 rounded">Add</button>
        </div>
        <div className="space-y-3">
          {milestones.map((m) => {
            const draft = drafts[m.id];
            if (!draft) return null;
            return (
              <div key={m.id} className="border rounded p-3 space-y-2">
                <input value={draft.title} onChange={(e) => patchDraft(m.id, 'title', e.target.value)} className="w-full border rounded p-2" />
                <textarea value={draft.description} onChange={(e) => patchDraft(m.id, 'description', e.target.value)} className="w-full border rounded p-2" rows={2} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="date" value={draft.due_date} onChange={(e) => patchDraft(m.id, 'due_date', e.target.value)} className="border rounded p-2" />
                  <select value={draft.status} onChange={(e) => patchDraft(m.id, 'status', e.target.value)} className="border rounded p-2">
                    <option value="not_started">not_started</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="overdue">overdue</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} value={draft.progress} onChange={(e) => patchDraft(m.id, 'progress', Number(e.target.value))} className="w-full" />
                    <span className="text-sm w-12">{draft.progress}%</span>
                  </div>
                </div>
                <button onClick={() => saveMilestone(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded">Save Changes</button>
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={submitNl} className="bg-white rounded-xl p-4 shadow space-y-2">
        <h2 className="font-semibold">Natural language update</h2>
        <input value={nlText} onChange={(e) => setNlText(e.target.value)} className="w-full border rounded p-2" />
        <button className="bg-blue-600 text-white px-3 py-2 rounded">Submit NLP Event</button>
      </form>
    </div>
  );
};

const Kpi = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white rounded-lg p-4 shadow">
    <p className="text-slate-500 text-sm">{title}</p>
    <p className="text-xl font-semibold">{value}</p>
  </div>
);
