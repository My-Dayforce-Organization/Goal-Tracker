import { FormEvent, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('employee1@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login({ token: data.token, userId: data.user_id, role: data.role, name: data.name });
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4 w-full max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-semibold">Milestone Tracker</h1>
      <p className="text-sm text-slate-500">Use seeded users to log in.</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded p-2" placeholder="Password" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="w-full bg-blue-600 text-white rounded p-2">Login</button>
    </form>
  );
};
