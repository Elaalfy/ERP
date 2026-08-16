import type { ReactNode } from 'react';
import { CompanySwitcher } from './CompanySwitcher';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">نظام إدارة المجموعة</h1>
        <div className="flex items-center gap-4">
          <CompanySwitcher />
          <span className="text-sm text-gray-600">{user?.fullName}</span>
          <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-red-600">
            تسجيل الخروج
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
