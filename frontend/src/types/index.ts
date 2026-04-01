export type Role = 'employee' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  manager_id?: string;
}

export interface Milestone {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  progress: number;
  status: string;
  approved: boolean;
}

export interface Dashboard {
  total_milestones: number;
  completed_milestones: number;
  overdue_milestones: number;
  average_progress: number;
  by_employee: Record<string, { count: number; avg_progress: number }>;
}

export interface AuthState {
  token: string;
  userId: string;
  role: Role;
  name: string;
}
