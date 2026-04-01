import { createContext, useContext, useMemo, useState } from 'react';
import { AuthState } from '../types';
import { setAuthHeader } from '../services/api';

interface AuthContextValue {
  auth: AuthState | null;
  login: (payload: AuthState) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const raw = localStorage.getItem('milestone_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    setAuthHeader(parsed.token);
    return parsed;
  });

  const value = useMemo(
    () => ({
      auth,
      login: (payload: AuthState) => {
        setAuth(payload);
        localStorage.setItem('milestone_auth', JSON.stringify(payload));
        setAuthHeader(payload.token);
      },
      logout: () => {
        setAuth(null);
        localStorage.removeItem('milestone_auth');
        setAuthHeader(null);
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Auth context not available');
  return value;
};
