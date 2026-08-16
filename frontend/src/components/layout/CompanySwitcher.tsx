import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';

export function CompanySwitcher() {
  const { companies } = useAuth();
  const { company, setCompany } = useCompany();
  const [initialized, setInitialized] = useState(false);

  // عند أول تحميل لشركات المستخدم المصرح بها، نختار الأولى تلقائياً حتى لا تبقى الشاشات فارغة
  useEffect(() => {
    if (!initialized && companies.length > 0 && !company) {
      setCompany({ id: companies[0].companyId, name: companies[0].companyName, role: companies[0].role });
      setInitialized(true);
    }
  }, [companies, initialized, company, setCompany]);

  return (
    <select
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
      value={company?.id ?? ''}
      onChange={(e) => {
        const selected = companies.find((c) => c.companyId === e.target.value);
        setCompany(selected ? { id: selected.companyId, name: selected.companyName, role: selected.role } : null);
      }}
    >
      <option value="" disabled>
        اختر الشركة
      </option>
      {companies.map((c) => (
        <option key={c.companyId} value={c.companyId}>
          {c.companyName}
        </option>
      ))}
    </select>
  );
}
