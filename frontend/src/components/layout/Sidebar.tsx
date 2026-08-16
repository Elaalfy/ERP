import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/accounting/accounts', label: 'شجرة الحسابات' },
  { to: '/accounting/journal-entries', label: 'القيود المحاسبية' },
  { to: '/accounting/invoice-templates', label: 'قوالب الفواتير' },
  { to: '/accounting/fiscal-periods', label: 'الفترات المالية' },
  { to: '/sales/pos', label: 'نقطة البيع' },
  { to: '/purchasing/invoices', label: 'فواتير الشراء' },
  { to: '/purchasing/suppliers', label: 'الموردون' },
  { to: '/hr/employees', label: 'الموظفون' },
  { to: '/hr/payroll', label: 'الرواتب' },
  { to: '/reports/group', label: 'التقارير الموحدة' },
];

export function Sidebar() {
  const { user } = useAuth();
  const items = user?.isGroupManager ? [...navItems, { to: '/users', label: 'إدارة المستخدمين' }] : navItems;

  return (
    <nav className="w-56 shrink-0 border-l border-gray-200 bg-white h-full p-4 flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
