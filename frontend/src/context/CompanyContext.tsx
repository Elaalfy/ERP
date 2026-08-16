import { createContext, useContext, useState, type ReactNode } from 'react';

interface Company {
  id: string;
  name: string;
  role: string;
}

interface CompanyContextValue {
  company: Company | null;
  setCompany: (company: Company | null) => void;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany يجب أن يُستخدم داخل CompanyProvider');
  return ctx;
}
