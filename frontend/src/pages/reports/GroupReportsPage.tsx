import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { SelectField } from '../../components/ui/SelectField';

// قيمة مؤقتة لحين بناء شاشة تسجيل الدخول الفعلية (نفس نمط بقية الشاشات).
// يجب أن يكون هذا المستخدم فعلياً بدور group_manager في قاعدة البيانات، وإلا يرفض الباك اند الطلب بـ 403.
const PLACEHOLDER_USER_ID = '1c5ae9bb-7d21-4228-a328-dedb49dba710';

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

interface CompanySummary {
  companyId: string;
  companyName: string;
  totalSales: number;
  totalPurchases: number;
  grossProfit: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventoryValue: number;
  payrollExpense: number;
  employeeAdvancesBalance: number;
}

interface GroupSummaryResponse {
  companies: CompanySummary[];
  groupTotals: CompanySummary;
  filter: { month: number; year: number } | null;
}

interface AgingRow {
  companyId: string;
  companyName: string;
  balance: number;
  buckets: { current: number; days30to60: number; over60: number };
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

function money(value: number) {
  return `${Number(value).toLocaleString('ar')} ر.س`;
}

export function GroupReportsPage() {
  const today = new Date();
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [periodMode, setPeriodMode] = useState<'month' | 'all'>('month');
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get<CompanyOption[]>('/companies');
      return res.data;
    },
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['group-summary', month, year, periodMode],
    queryFn: async () => {
      const res = await api.get<GroupSummaryResponse>('/reports/group/summary', {
        params: {
          userId: PLACEHOLDER_USER_ID,
          ...(periodMode === 'month' ? { month, year } : {}),
        },
      });
      return res.data;
    },
  });

  const {
    data: receivablesAging,
    error: receivablesError,
  } = useQuery({
    queryKey: ['receivables-aging'],
    queryFn: async () => {
      const res = await api.get<AgingRow[]>('/reports/group/receivables-aging', {
        params: { userId: PLACEHOLDER_USER_ID },
      });
      return res.data;
    },
  });

  const {
    data: payablesAging,
    error: payablesError,
  } = useQuery({
    queryKey: ['payables-aging'],
    queryFn: async () => {
      const res = await api.get<AgingRow[]>('/reports/group/payables-aging', {
        params: { userId: PLACEHOLDER_USER_ID },
      });
      return res.data;
    },
  });

  const visibleCompanies = useMemo(() => {
    if (!summary) return [];
    if (companyFilter === 'all') return summary.companies;
    return summary.companies.filter((c) => c.companyId === companyFilter);
  }, [summary, companyFilter]);

  const displayTotals = useMemo(() => {
    if (companyFilter !== 'all' && visibleCompanies.length === 1) return visibleCompanies[0];
    return summary?.groupTotals ?? null;
  }, [summary, companyFilter, visibleCompanies]);

  const filteredReceivables = useMemo(() => {
    if (!receivablesAging) return [];
    if (companyFilter === 'all') return receivablesAging;
    return receivablesAging.filter((r) => r.companyId === companyFilter);
  }, [receivablesAging, companyFilter]);

  const filteredPayables = useMemo(() => {
    if (!payablesAging) return [];
    if (companyFilter === 'all') return payablesAging;
    return payablesAging.filter((r) => r.companyId === companyFilter);
  }, [payablesAging, companyFilter]);

  const anyError = summaryError || receivablesError || payablesError;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">التقارير الموحدة للمجموعة</h2>
        <p className="text-sm text-gray-500 mt-1">
          نظرة شاملة على كل شركات المجموعة — مالياً، ومخزوناً، وذمماً، ورواتب.
        </p>
      </div>

      {anyError ? (
        <Card className="border-red-200 bg-red-50 text-red-700 text-sm">
          {extractErrorMessage(anyError)}
        </Card>
      ) : null}

      <Card className="flex flex-wrap items-end gap-4">
        <SelectField
          label="الشركة"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-56"
        >
          <option value="all">كل شركات المجموعة (إجمالي)</option>
          {companies?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="الفترة"
          value={periodMode}
          onChange={(e) => setPeriodMode(e.target.value as 'month' | 'all')}
          className="w-40"
        >
          <option value="month">شهر محدد</option>
          <option value="all">كل الفترات (منذ البداية)</option>
        </SelectField>

        {periodMode === 'month' ? (
          <>
            <SelectField
              label="الشهر"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-36"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="السنة"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-28"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </SelectField>
          </>
        ) : null}

        <span className="text-xs text-gray-400 mb-2">
          ملاحظة: الذمم والمخزون أرصدة لحظية دائماً، ولا تتأثر بفلتر الشهر.
        </span>
      </Card>

      {summaryLoading ? (
        <p className="text-gray-500 text-sm">جارٍ تحميل الملخص المالي...</p>
      ) : displayTotals ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="إجمالي المبيعات" value={money(displayTotals.totalSales)} tone="indigo" />
          <SummaryCard label="إجمالي المشتريات" value={money(displayTotals.totalPurchases)} tone="gray" />
          <SummaryCard
            label="إجمالي الربح (تقريبي)"
            value={money(displayTotals.grossProfit)}
            tone={displayTotals.grossProfit >= 0 ? 'green' : 'red'}
          />
          <SummaryCard label="قيمة المخزون الحالية" value={money(displayTotals.inventoryValue)} tone="gray" />
          <SummaryCard label="ذمم العملاء (مدينة)" value={money(displayTotals.accountsReceivable)} tone="amber" />
          <SummaryCard label="ذمم الموردين (دائنة)" value={money(displayTotals.accountsPayable)} tone="amber" />
          <SummaryCard label="إجمالي الرواتب المصروفة" value={money(displayTotals.payrollExpense)} tone="gray" />
          <SummaryCard
            label="رصيد سلف الموظفين القائم"
            value={money(displayTotals.employeeAdvancesBalance)}
            tone="gray"
          />
        </div>
      ) : null}

      {companyFilter === 'all' && summary && summary.companies.length > 1 ? (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">مقارنة بين الشركات</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-2">الشركة</th>
                  <th className="py-2">المبيعات</th>
                  <th className="py-2">المشتريات</th>
                  <th className="py-2">الربح</th>
                  <th className="py-2">المخزون</th>
                  <th className="py-2">ذمم عملاء</th>
                  <th className="py-2">ذمم موردين</th>
                  <th className="py-2">الرواتب</th>
                </tr>
              </thead>
              <tbody>
                {summary.companies.map((c) => (
                  <tr key={c.companyId} className="border-b border-gray-100">
                    <td className="py-2 pr-2 font-medium text-gray-800">{c.companyName}</td>
                    <td className="py-2">{money(c.totalSales)}</td>
                    <td className="py-2">{money(c.totalPurchases)}</td>
                    <td className={`py-2 ${c.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {money(c.grossProfit)}
                    </td>
                    <td className="py-2">{money(c.inventoryValue)}</td>
                    <td className="py-2">{money(c.accountsReceivable)}</td>
                    <td className="py-2">{money(c.accountsPayable)}</td>
                    <td className="py-2">{money(c.payrollExpense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <AgingTable
        title="أعمار ذمم العملاء (مدينة)"
        rows={filteredReceivables}
        nameKey="customerName"
      />

      <AgingTable
        title="أعمار ذمم الموردين (دائنة)"
        rows={filteredPayables}
        nameKey="supplierName"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'indigo' | 'gray' | 'green' | 'red' | 'amber';
}) {
  const toneClass: Record<string, string> = {
    indigo: 'text-indigo-700',
    gray: 'text-gray-800',
    green: 'text-green-700',
    red: 'text-red-700',
    amber: 'text-amber-700',
  };
  return (
    <Card>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${toneClass[tone]}`}>{value}</p>
    </Card>
  );
}

function AgingTable({
  title,
  rows,
  nameKey,
}: {
  title: string;
  rows: AgingRow[];
  nameKey: 'customerName' | 'supplierName';
}) {
  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">لا توجد أرصدة قائمة حالياً.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-2">الاسم</th>
                <th className="py-2">الشركة</th>
                <th className="py-2">0-30 يوم</th>
                <th className="py-2">30-60 يوم</th>
                <th className="py-2 text-red-600">أكثر من 60 يوماً</th>
                <th className="py-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.customerId ?? row.supplierId} className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-medium text-gray-800">{row[nameKey]}</td>
                  <td className="py-2 text-gray-500">{row.companyName}</td>
                  <td className="py-2">{money(row.buckets.current)}</td>
                  <td className="py-2 text-amber-700">{money(row.buckets.days30to60)}</td>
                  <td className="py-2 text-red-700 font-medium">{money(row.buckets.over60)}</td>
                  <td className="py-2 font-bold">{money(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
