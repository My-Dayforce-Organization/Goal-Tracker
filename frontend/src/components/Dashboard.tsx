import { FormEvent, useEffect, useState } from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Dashboard as DashboardType, Milestone } from '../types';

const COLORS = ['#16a34a', '#dc2626', '#0ea5e9'];

export const Dashboard = () => {
  const { auth, logout } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [nlText, setNlText] = useState('Update milestone m_emp1_1 to 65%');

  const load = async () => {
    if (!auth) return;
    const milestoneUserId = auth.role === 'manager' ? 'u_emp_1' : auth.userId;
    const [{ data: milestoneData }, { data: dashboardData }] = await Promise.all([
      api.get(`/users/${milestoneUserId}/milestones`),
      api.get('/dashboard'),
    ]);
    setMilestones(milestoneData);
    setDashboard(dashboardData);
  };

  useEffect(() => {
    load();
  }, [auth?.userId]);

  const updateProgress = async (id: string, progress: number) => {
    await api.put(`/milestones/${id}`, { progress });
    await load();
  };

  const createMilestone = async () => {
    if (!auth) return;
    await api.post('/milestones', {
      user_id: auth.role === 'manager' ? 'u_emp_1' : auth.userId,
      title: `New milestone ${new Date().toLocaleTimeString()}`,
      description: 'Created from demo UI',
      due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
      progress: 0,
    });
    await load();
  };

  const submitNl = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    const targetUser = auth.role === 'manager' ? 'u_emp_1' : auth.userId;
    await api.post('/nl/ingest', {
      user_id: targetUser,
      client_event_id: `ui-${Date.now()}`,
      text: nlText,
    });
    await load();
  };

  if (!auth || !dashboard) return null;

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
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className="border rounded p-3">
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-slate-500">Due: {new Date(m.due_date).toLocaleDateString()} • Status: {m.status}</p>
              <input type="range" min={0} max={100} value={m.progress} onChange={(e) => updateProgress(m.id, Number(e.target.value))} className="w-full" />
              <p className="text-sm">Progress: {m.progress}%</p>
            </div>
          ))}
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
