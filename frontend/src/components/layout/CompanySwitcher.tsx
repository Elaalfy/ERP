import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';

interface CompanyOption {
  id: string;
  name: string;
}

export function CompanySwitcher() {
  const { company, setCompany } = useCompany();
  const [initialized, setInitialized] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get<CompanyOption[]>('/companies');
      return res.data;
    },
  });

  // عند أول تحميل للشركات، نختار الأولى تلقائياً كافتراضي حتى لا تبقى الشاشات فارغة
  useEffect(() => {
    if (!initialized && companies && companies.length > 0 && !company) {
      setCompany(companies[0]);
      setInitialized(true);
    }
  }, [companies, initialized, company, setCompany]);

  return (
    <select
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
      value={company?.id ?? ''}
      onChange={(e) => {
        const selected = companies?.find((c) => c.id === e.target.value);
        setCompany(selected ?? null);
      }}
    >
      <option value="" disabled>
        اختر الشركة
      </option>
      {companies?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
