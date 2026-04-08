import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Dashboard as DashboardType, Milestone } from '../types';

const COLORS = ['#86efac', '#fecaca', '#bfdbfe'];

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

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
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [nlText, setNlText] = useState('update status of Launch onboarding revamp to completed');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const getScopedUserId = () => (auth?.role === 'manager' ? 'u_emp_1' : auth?.userId);

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
    setEditing(Object.fromEntries(items.map((m) => [m.id, false])));
  };

  const load = async (showPageLoader = true) => {
    if (!auth) return;
    if (showPageLoader) setLoading(true);
    setError(null);
    try {
      const milestoneUserId = getScopedUserId();
      const [{ data: milestoneData }, { data: dashboardData }] = await Promise.all([
        api.get(`/users/${milestoneUserId}/milestones`),
        api.get('/dashboard'),
      ]);
      setMilestones(milestoneData);
      buildDrafts(milestoneData);
      setDashboard(dashboardData);
      const newCompletedIds = new Set((milestoneData as Milestone[]).filter((m) => m.progress >= 100).map((m) => m.id));
      const hasNewCompletion = [...newCompletedIds].some((id) => !completedIds.has(id));
      if (hasNewCompletion) {
        setShowCongrats(true);
      }
      setCompletedIds(newCompletedIds);
    } catch {
      setError('Could not load dashboard data. Verify backend is reachable and refresh.');
    } finally {
      if (showPageLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [auth?.userId]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!showCongrats) return;
    const timer = setTimeout(() => setShowCongrats(false), 2800);
    return () => clearTimeout(timer);
  }, [showCongrats]);

  const patchDraft = (milestoneId: string, key: keyof MilestoneDraft, value: string | number) => {
    setDrafts((prev) => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        [key]: value,
      },
    }));
  };

  const handleProgressChange = (milestoneId: string, progress: number) => {
    const nextStatus = progress >= 100 ? 'completed' : progress <= 0 ? 'not_started' : 'in_progress';
    setDrafts((prev) => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        progress,
        status: nextStatus,
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
      setNotice('Milestone changes saved.');
      await load(false);
    } catch {
      setError('Failed to save milestone changes.');
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    try {
      await api.delete(`/milestones/${milestoneId}`);
      setNotice('Milestone deleted.');
      await load(false);
    } catch {
      setError('Failed to delete milestone.');
    }
  };

  const createMilestone = async () => {
    if (!auth) return;
    try {
      await api.post('/milestones', {
        user_id: getScopedUserId(),
        title: `New milestone ${new Date().toLocaleTimeString()}`,
        description: 'Created from demo UI',
        due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        progress: 0,
      });
      setNotice('Milestone created.');
      await load(false);
    } catch {
      setError('Failed to create milestone.');
    }
  };

  const submitNl = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    try {
      await api.post('/nl/ingest', {
        user_id: getScopedUserId(),
        client_event_id: `ui-${Date.now()}`,
        text: nlText,
      });
      setNotice('Natural language update applied.');
      await load(false);
    } catch {
      setError('Failed to process natural language update.');
    }
  };

  const handleAskAi = async () => {
    const question = nlText.trim();
    if (!question) return;

    const q = question.toLowerCase();
    const completed = milestones.filter((m) => m.status === 'completed');
    const overdue = milestones.filter((m) => m.status === 'overdue');
    const inProgress = milestones.filter((m) => m.status === 'in_progress');

    if (q.includes('update') || q.includes('status of') || q.includes('%') || q.includes('milestone')) {
      await submitNl({ preventDefault: () => {} } as FormEvent);
      setAiResponse('I applied your update request and refreshed the dashboard.');
      return;
    }

    if (q.includes('overdue')) {
      setAiResponse(
        overdue.length
          ? `You have ${overdue.length} overdue milestone(s): ${overdue.map((m) => m.title).join(', ')}.`
          : 'Great news — there are no overdue milestones right now.'
      );
      return;
    }

    if (q.includes('completed')) {
      setAiResponse(
        completed.length
          ? `Completed milestones (${completed.length}): ${completed.map((m) => m.title).join(', ')}.`
          : 'No milestones are completed yet.'
      );
      return;
    }

    setAiResponse(
      `Summary: Total ${dashboard?.total_milestones ?? milestones.length}, Completed ${completed.length}, In Progress ${inProgress.length}, Overdue ${overdue.length}, Avg Progress ${dashboard?.average_progress ?? 0}%.`
    );
  };

  const pieData = useMemo(() => {
    if (!dashboard) return [];
    return [
      { name: 'Completed', value: dashboard.completed_milestones },
      { name: 'Overdue', value: dashboard.overdue_milestones },
      { name: 'In Progress', value: Math.max(dashboard.total_milestones - dashboard.completed_milestones - dashboard.overdue_milestones, 0) },
    ];
  }, [dashboard]);

  if (!auth) return null;
  if (loading) return <div className="min-h-screen p-6 text-slate-600">Loading dashboard…</div>;

  if (error) {
    return (
      <div className="min-h-screen p-6 space-y-3">
        <h1 className="text-xl font-semibold">Dashboard unavailable</h1>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-slate-600">Backend docs: <a className="underline" href="/api/docs" target="_blank" rel="noreferrer">/api/docs</a></p>
        <button onClick={() => load()} className="bg-blue-600 text-white px-3 py-2 rounded">Retry</button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-4 relative">
      {notice && <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg z-50">{notice}</div>}
      {showCongrats && (
        <div className="congrats-banner bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg">
          🎉 Congratulations, you have completed a milestone!
        </div>
      )}

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

        <section className="bg-white rounded-xl p-4 shadow overflow-auto">
          <h2 className="font-semibold mb-2">Milestone Summary</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Milestone</th>
                <th className="py-2">Status</th>
                <th className="py-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className={`border-b ${statusRowClass(m.status)}`}>
                  <td className="py-2">{m.title}</td>
                  <td className="py-2 capitalize">{m.status.replaceAll('_', ' ')}</td>
                  <td className="py-2">{m.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            const isEditing = editing[m.id];
            return (
              <div key={m.id} className="border rounded p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{m.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} className="text-slate-600 border rounded px-2 py-1" title="Edit" aria-label="Edit">
                      ✏️
                    </button>
                    <button onClick={() => deleteMilestone(m.id)} className="text-red-600 border border-red-200 rounded px-2 py-1" title="Delete" aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="text-sm text-slate-600 space-y-1">
                    <p><span className="font-medium">Description:</span> {m.description || '-'}</p>
                    <p><span className="font-medium">Due date:</span> {new Date(m.due_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> {m.status.replaceAll('_', ' ')}</p>
                    <p><span className="font-medium">Progress:</span> {m.progress}%</p>
                  </div>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-slate-600">Title</label>
                    <input value={draft.title} onChange={(e) => patchDraft(m.id, 'title', e.target.value)} className="w-full border rounded p-2" />
                    <label className="block text-xs font-medium text-slate-600">Description</label>
                    <textarea value={draft.description} onChange={(e) => patchDraft(m.id, 'description', e.target.value)} className="w-full border rounded p-2" rows={2} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input type="date" value={draft.due_date} onChange={(e) => patchDraft(m.id, 'due_date', e.target.value)} className="border rounded p-2" />
                      <select value={draft.status} onChange={(e) => patchDraft(m.id, 'status', e.target.value)} className="border rounded p-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={100} value={draft.progress} onChange={(e) => handleProgressChange(m.id, Number(e.target.value))} className="w-full" />
                        <span className="text-sm w-12">{draft.progress}%</span>
                      </div>
                    </div>
                    <button onClick={() => saveMilestone(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={(e) => { e.preventDefault(); void handleAskAi(); }} className="rounded-2xl p-5 shadow text-white w-full md:w-1/2" style={{ background: 'linear-gradient(90deg, #0d67d8 0%, #1d88e5 100%)' }}>
        <div className="bg-white/90 rounded-2xl p-6 text-slate-900 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold leading-tight">How can I help you today?</h2>
              <p className="text-base text-slate-600 mt-1">Update and complete tasks with AI Assistant.</p>
            </div>
            <button type="button" onClick={() => void handleAskAi()} className="self-start md:self-center inline-flex items-center gap-2 bg-white border border-slate-300 rounded-full px-5 py-2 text-base font-semibold hover:bg-slate-50">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white">✦</span>
              Ask AI
            </button>
          </div>
          <input value={nlText} onChange={(e) => setNlText(e.target.value)} className="w-full border rounded-xl p-3 text-base" placeholder="Ask for summary or request an update" />
          {aiResponse && <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-slate-700">{aiResponse}</div>}
        </div>
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

const statusRowClass = (status: string) => {
  if (status === 'overdue') return 'bg-red-50 text-red-800';
  if (status === 'completed') return 'bg-green-50 text-green-800';
  if (status === 'in_progress') return 'bg-amber-50 text-amber-800';
  return 'bg-slate-50 text-slate-700';
};
