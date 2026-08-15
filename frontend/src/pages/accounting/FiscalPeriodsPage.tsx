import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import type { FiscalPeriod } from '../../lib/useActiveFiscalPeriod';

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function FiscalPeriodsPage() {
  const { company } = useCompany();

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  return <FiscalPeriodsWorkspace companyId={company.id} companyName={company.name} />;
}

function FiscalPeriodsWorkspace({ companyId, companyName }: { companyId: string; companyName: string }) {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const { data: periods, isLoading } = useQuery({
    queryKey: ['fiscal-periods', companyId],
    queryFn: async () => {
      const res = await api.get<FiscalPeriod[]>('/accounting/fiscal-periods', { params: { companyId } });
      return res.data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fiscal-periods', companyId] });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ created: FiscalPeriod[]; skipped: string[] }>(
        '/accounting/fiscal-periods/generate-year',
        { companyId, year: Number(year) },
      );
      return res.data;
    },
    onSuccess: invalidate,
  });

  const manualCreateMutation = useMutation({
    mutationFn: async () => {
      await api.post('/accounting/fiscal-periods', {
        companyId,
        startDate: manualStart,
        endDate: manualEnd,
      });
    },
    onSuccess: () => {
      setManualStart('');
      setManualEnd('');
      setShowManualForm(false);
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'close' | 'reopen' }) => {
      await api.post(`/accounting/fiscal-periods/${id}/${action}`);
    },
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">الفترات المالية — {companyName}</h2>
      </div>

      <Card>
        <h3 className="font-bold text-gray-900 mb-3">توليد سنة كاملة (12 فترة شهرية)</h3>
        <div className="flex items-end gap-3">
          <Field label="السنة" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          <Button onClick={() => generateMutation.mutate()} disabled={!year || generateMutation.isPending}>
            {generateMutation.isPending ? 'جاري التوليد...' : 'توليد الفترات'}
          </Button>
        </div>

        {generateMutation.isError && (
          <p className="text-sm text-red-600 mt-2">{extractErrorMessage(generateMutation.error)}</p>
        )}

        {generateMutation.isSuccess && (
          <p className="text-sm text-gray-600 mt-2">
            تم إنشاء {generateMutation.data.created.length} فترة جديدة
            {generateMutation.data.skipped.length > 0 &&
              ` (تم تخطي ${generateMutation.data.skipped.length} شهراً كانت موجودة مسبقاً)`}
            .
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">إضافة فترة يدوية</h3>
          <Button variant="secondary" onClick={() => setShowManualForm((v) => !v)}>
            {showManualForm ? 'إلغاء' : '+ فترة جديدة'}
          </Button>
        </div>

        {showManualForm && (
          <div className="flex items-end gap-3">
            <Field
              label="تاريخ البداية"
              type="date"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
            />
            <Field
              label="تاريخ النهاية"
              type="date"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
            />
            <Button
              onClick={() => manualCreateMutation.mutate()}
              disabled={!manualStart || !manualEnd || manualCreateMutation.isPending}
            >
              {manualCreateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الفترة'}
            </Button>
          </div>
        )}

        {manualCreateMutation.isError && (
          <p className="text-sm text-red-600 mt-2">{extractErrorMessage(manualCreateMutation.error)}</p>
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-gray-900 mb-3">قائمة الفترات</h3>
        {isLoading ? (
          <p className="text-gray-500 text-sm">جاري التحميل...</p>
        ) : !periods || periods.length === 0 ? (
          <p className="text-gray-400 text-sm">لا توجد فترات مالية بعد لهذه الشركة.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">الفترة</th>
                <th className="pb-2 font-medium">من</th>
                <th className="pb-2 font-medium">إلى</th>
                <th className="pb-2 font-medium">الحالة</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const monthIndex = new Date(p.startDate).getUTCMonth();
                return (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">
                      {monthNames[monthIndex]} {new Date(p.startDate).getUTCFullYear()}
                    </td>
                    <td className="py-2 text-gray-600">{p.startDate}</td>
                    <td className="py-2 text-gray-600">{p.endDate}</td>
                    <td className="py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'open'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                      </span>
                    </td>
                    <td className="py-2 text-left">
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1"
                        disabled={toggleMutation.isPending}
                        onClick={() =>
                          toggleMutation.mutate({ id: p.id, action: p.status === 'open' ? 'close' : 'reopen' })
                        }
                      >
                        {p.status === 'open' ? 'إغلاق' : 'إعادة فتح'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <p className="text-xs text-gray-400 mt-3">
          ملاحظة: إغلاق الفترة حالياً علامة إعلامية فقط، ولا يمنع تسجيل قيود جديدة بتاريخ داخلها.
        </p>
      </Card>
    </div>
  );
}
