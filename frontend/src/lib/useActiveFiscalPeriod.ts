import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface FiscalPeriod {
  id: string;
  companyId: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

// يجلب الفترة المالية المفتوحة الحالية للشركة (تُستخدم كـ periodId افتراضي في أي قيد/فاتورة جديدة)
export function useActiveFiscalPeriod(companyId: string | undefined) {
  const query = useQuery({
    queryKey: ['fiscal-periods', 'active', companyId],
    queryFn: async () => {
      const { data } = await api.get<FiscalPeriod>('/accounting/fiscal-periods/active', {
        params: { companyId },
      });
      return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  return {
    periodId: query.data?.id,
    period: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
