import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isGroupManager: boolean;
}

export interface UserCompanyAccess {
  companyId: string;
  companyName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  companies: UserCompanyAccess[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companies, setCompanies] = useState<UserCompanyAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clearState = () => {
    setUser(null);
    setCompanies([]);
  };

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setCompanies(res.data.companies);
    } catch {
      clearState();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    const handleForceLogout = () => clearState();
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    setCompanies(res.data.companies);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearState();
    }
  };

  return (
    <AuthContext.Provider value={{ user, companies, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider');
  return ctx;
}
