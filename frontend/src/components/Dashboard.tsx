import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Dashboard as DashboardType, Milestone } from '../types';

type MilestoneDraft = {
  title: string;
  description: string;
  due_date: string;
  progress: number;
  status: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  collapsed: boolean;
};

const CHAT_KEY = 'milestone_chat_history';
const PIE_COLORS = ['#86efac', '#fecaca', '#bfdbfe'];

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const loadChatFromSession = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
};

const saveChatToSession = (messages: ChatMessage[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch {
    // ignore storage failures
  }
};

export const Dashboard = () => {
  const { auth, logout } = useAuth();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MilestoneDraft>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadChatFromSession);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const scopedUserId = auth?.role === 'manager' ? 'u_emp_1' : auth?.userId;

  const syncDrafts = (items: Milestone[]) => {
    const nextDrafts: Record<string, MilestoneDraft> = {};
    const nextEditing: Record<string, boolean> = {};
    items.forEach((m) => {
      nextDrafts[m.id] = {
        title: m.title,
        description: m.description,
        due_date: m.due_date.slice(0, 10),
        progress: m.progress,
        status: m.status,
      };
      nextEditing[m.id] = false;
    });
    setDrafts(nextDrafts);
    setEditing(nextEditing);
  };

  const loadData = async (showSpinner = true) => {
    if (!auth || !scopedUserId) return;
    if (showSpinner) setLoading(true);

    try {
      setError(null);
      const [milestoneRes, dashboardRes] = await Promise.all([
        api.get(`/users/${scopedUserId}/milestones`),
        api.get('/dashboard'),
      ]);

      const items = milestoneRes.data as Milestone[];
      setMilestones(items);
      setDashboard(dashboardRes.data as DashboardType);
      syncDrafts(items);

      const newCompleted = new Set(items.filter((m) => m.progress >= 100).map((m) => m.id));
      const hasNewCompletion = [...newCompleted].some((id) => !completedIds.has(id));
      if (hasNewCompletion) setShowCongrats(true);
      setCompletedIds(newCompleted);
    } catch {
      setError('Could not load dashboard data. Verify backend is reachable and refresh.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [auth?.userId]);

  useEffect(() => {
    saveChatToSession(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!showCongrats) return;
    const timer = setTimeout(() => setShowCongrats(false), 2500);
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

  const patchProgress = (milestoneId: string, value: number) => {
    const status = value >= 100 ? 'completed' : value <= 0 ? 'not_started' : 'in_progress';
    setDrafts((prev) => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        progress: value,
        status,
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
        progress: draft.progress,
        status: draft.status,
      });
      setNotice('Milestone saved.');
      await loadData(false);
    } catch {
      setError('Failed to save milestone.');
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    try {
      await api.delete(`/milestones/${milestoneId}`);
      setNotice('Milestone deleted.');
      await loadData(false);
    } catch {
      setError('Failed to delete milestone.');
    }
  };

  const createMilestone = async () => {
    if (!scopedUserId) return;
    try {
      await api.post('/milestones', {
        user_id: scopedUserId,
        title: `New milestone ${new Date().toLocaleTimeString()}`,
        description: 'Created from demo UI',
        due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        progress: 0,
      });
      setNotice('Milestone created.');
      await loadData(false);
    } catch {
      setError('Failed to create milestone.');
    }
  };

  const sendNlUpdate = async (text: string): Promise<boolean> => {
    if (!scopedUserId) return false;
    try {
      await api.post('/nl/ingest', {
        user_id: scopedUserId,
        client_event_id: `ui-${Date.now()}`,
        text,
      });
      await loadData(false);
      return true;
    } catch {
      return false;
    }
  };

  const answerQuestion = (question: string): string => {
    const q = question.toLowerCase();
    const completed = milestones.filter((m) => m.status === 'completed');
    const overdue = milestones.filter((m) => m.status === 'overdue');
    const pending = milestones.filter((m) => m.status !== 'completed');

    if (q.includes('status')) {
      return milestones.map((m) => `${m.title}: ${m.status.replaceAll('_', ' ')}`).join(' | ');
    }
    if (q.includes('description')) {
      return milestones.map((m) => `${m.title}: ${m.description || 'No description'}`).join(' | ');
    }
    if (q.includes('due') || q.includes('date')) {
      return milestones.map((m) => `${m.title}: ${new Date(m.due_date).toLocaleDateString()}`).join(' | ');
    }
    if (q.includes('pending')) {
      return pending.length ? `Pending actions: ${pending.map((m) => m.title).join(', ')}` : 'No pending actions.';
    }
    if (q.includes('overdue')) {
      return overdue.length ? `Overdue milestones: ${overdue.map((m) => m.title).join(', ')}` : 'No overdue milestones.';
    }
    if (q.includes('completed')) {
      return completed.length ? `Completed milestones: ${completed.map((m) => m.title).join(', ')}` : 'No completed milestones yet.';
    }

    return `Summary — Total: ${dashboard?.total_milestones ?? milestones.length}, Completed: ${completed.length}, Overdue: ${overdue.length}, Avg Progress: ${dashboard?.average_progress ?? 0}%.`;
  };

  const submitChat = async (e: FormEvent) => {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question) return;

    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: question, collapsed: false }]);

    const maybeUpdate = question.toLowerCase().includes('update') || question.includes('%') || question.toLowerCase().includes('milestone');
    if (maybeUpdate) {
      const ok = await sendNlUpdate(question);
      const answer = ok ? 'Done. I updated the milestone and refreshed the dashboard.' : 'I could not process that update. Try rephrasing.';
      setChatMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: answer, collapsed: true }]);
      setNotice(ok ? 'Natural language update applied.' : 'Natural language update failed.');
    } else {
      setChatMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: answerQuestion(question), collapsed: true }]);
    }

    setChatInput('');
  };

  const toggleChatMessage = (id: string) => {
    setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, collapsed: !m.collapsed } : m)));
  };

  const resetChat = () => {
    setChatMessages([]);
    saveChatToSession([]);
  };

  const pieData = useMemo(() => {
    if (!dashboard) return [];
    return [
      { name: 'Completed', value: dashboard.completed_milestones },
      { name: 'Overdue', value: dashboard.overdue_milestones },
      {
        name: 'In Progress',
        value: Math.max(dashboard.total_milestones - dashboard.completed_milestones - dashboard.overdue_milestones, 0),
      },
    ];
  }, [dashboard]);

  if (!auth) return null;
  if (loading) return <div className="min-h-screen p-6 text-slate-600">Loading dashboard…</div>;
  if (error) {
    return (
      <div className="min-h-screen p-6 space-y-3">
        <h1 className="text-xl font-semibold">Dashboard unavailable</h1>
        <p className="text-red-600">{error}</p>
        <button onClick={() => void loadData()} className="bg-blue-600 text-white px-3 py-2 rounded">Retry</button>
      </div>
    );
  }
  if (!dashboard) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-4 relative">
      {notice && <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg z-50">{notice}</div>}
      {showCongrats && <div className="congrats-banner bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg">🎉 Congratulations, you have completed a milestone!</div>}

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
                {pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
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
            const isEditing = editing[m.id];
            if (!draft) return null;

            return (
              <div key={m.id} className="border rounded p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{m.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} className="text-slate-600 border rounded px-2 py-1" title="Edit" aria-label="Edit">✏️</button>
                    <button onClick={() => void deleteMilestone(m.id)} className="text-red-600 border border-red-200 rounded px-2 py-1" title="Delete" aria-label="Delete">🗑️</button>
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
                        <input type="range" min={0} max={100} value={draft.progress} onChange={(e) => patchProgress(m.id, Number(e.target.value))} className="w-full" />
                        <span className="text-sm w-12">{draft.progress}%</span>
                      </div>
                    </div>
                    <button onClick={() => void saveMilestone(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl p-2 shadow text-white w-full md:w-1/2" style={{ background: 'linear-gradient(90deg, #0d67d8 0%, #1d88e5 100%)' }}>
        <div className="bg-white/90 rounded-2xl p-4 text-slate-900 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <button onClick={resetChat} className="font-semibold text-sm">+ New chat</button>
            <span className="text-xl">−</span>
          </div>

          <div className="text-center py-2">
            <div className="text-2xl">✦ ✦</div>
            <h2 className="text-lg font-semibold">How can I help you today?</h2>
            <p className="text-xs text-slate-600">Get answers and complete tasks with AI Assistant.</p>
          </div>

          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {chatMessages.map((message) => {
              const preview = message.collapsed && message.text.length > 180 ? `${message.text.slice(0, 180)}...` : message.text;
              return (
                <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={message.role === 'user' ? 'bg-blue-100 rounded-2xl px-3 py-2 max-w-[85%] text-sm' : 'bg-slate-100 rounded-2xl px-3 py-2 max-w-[85%] text-sm'}>
                    <p>{preview}</p>
                    <button onClick={() => toggleChatMessage(message.id)} className="text-xs text-slate-500 underline mt-1">
                      {message.collapsed ? 'Expand' : 'Collapse'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={submitChat} className="space-y-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
              className="w-full border border-blue-400 rounded-xl p-3 text-sm"
              rows={3}
              placeholder="Message"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{chatInput.length}/200</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">Send ➤</button>
            </div>
          </form>
        </div>
      </section>
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
