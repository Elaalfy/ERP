import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { useHrPostingAccounts } from '../../lib/useHrPostingAccounts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { HrPostingAccountsSetup } from './HrPostingAccountsSetup';
import type { Employee } from './EmployeesPage';

// قيم مؤقتة لحين بناء شاشات الفترات المالية والمستخدمين وربطها فعلياً (بنفس نمط نقطة البيع والمشتريات)
const PLACEHOLDER_PERIOD_ID = '8a4e76a3-0076-4c7b-bc6c-3f300a53486f';
const PLACEHOLDER_USER_ID = '1c5ae9bb-7d21-4228-a328-dedb49dba710';

interface Payslip {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: string;
  gosiDeduction: string;
  otherDeductions: string;
  netPay: number;
}

interface PayrollRun {
  id: string;
  periodMonth: number;
  periodYear: number;
  totalNetPay: string;
  createdAt: string;
  payslips: Payslip[];
}

export function PayrollPage() {
  const { company } = useCompany();
  const { accounts, save, isComplete } = useHrPostingAccounts(company?.id);

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  if (!isComplete) {
    return <HrPostingAccountsSetup companyId={company.id} onSave={save} />;
  }

  return <PayrollWorkspace companyId={company.id} companyName={company.name} accounts={accounts} />;
}

function PayrollWorkspace({
  companyId,
  companyName,
  accounts,
}: {
  companyId: string;
  companyName: string;
  accounts: ReturnType<typeof useHrPostingAccounts>['accounts'];
}) {
  const queryClient = useQueryClient();
  const today = new Date();
  const [periodMonth, setPeriodMonth] = useState(today.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(today.getFullYear());
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [lastRun, setLastRun] = useState<PayrollRun | null>(null);

  const { data: employees } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const res = await api.get<Employee[]>('/hr/employees', { params: { companyId } });
      return res.data.filter((e) => e.isActive);
    },
  });

  const { data: balances } = useQuery({
    queryKey: ['employee-advance-balances', companyId, employees?.map((e) => e.id)],
    queryFn: async () => {
      if (!employees) return {};
      const entries = await Promise.all(
        employees.map(async (e) => {
          const res = await api.get<{ balance: number }>(`/hr/employees/${e.id}/advances/balance`);
          return [e.id, res.data.balance] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    enabled: !!employees && employees.length > 0,
  });

  const { data: previousRuns } = useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: async () => {
      const res = await api.get<PayrollRun[]>('/hr/payroll', { params: { companyId } });
      return res.data;
    },
  });

  const preview = useMemo(() => {
    return (employees ?? []).map((e) => {
      const basicSalary = Number(e.basicSalary);
      const allowances = Number(e.fixedAllowances);
      const gosiDeduction = Math.round(basicSalary * Number(e.gosiEmployeeRate) * 100) / 100;
      const deduction = Number(deductions[e.id] || 0);
      const netPay = basicSalary + allowances - gosiDeduction - deduction;
      return { employee: e, basicSalary, allowances, gosiDeduction, deduction, netPay };
    });
  }, [employees, deductions]);

  const totalNetPay = preview.reduce((sum, p) => sum + p.netPay, 0);

  const runMutation = useMutation({
    mutationFn: async () => {
      const manualDeductions = Object.entries(deductions)
        .filter(([, v]) => Number(v) > 0)
        .map(([employeeId, amount]) => ({ employeeId, amount: Number(amount) }));

      const res = await api.post<PayrollRun>('/hr/payroll/run', {
        companyId,
        periodMonth,
        periodYear,
        periodId: PLACEHOLDER_PERIOD_ID,
        createdById: PLACEHOLDER_USER_ID,
        salaryExpenseAccountId: accounts.salaryExpenseAccountId,
        gosiPayableAccountId: accounts.gosiPayableAccountId,
        salariesPayableAccountId: accounts.salariesPayableAccountId,
        employeeAdvancesAccountId: accounts.employeeAdvancesAccountId,
        manualDeductions: manualDeductions.length > 0 ? manualDeductions : undefined,
      });
      return res.data;
    },
    onSuccess: (run) => {
      setLastRun(run);
      setDeductions({});
      queryClient.invalidateQueries({ queryKey: ['payroll-runs', companyId] });
      queryClient.invalidateQueries({ queryKey: ['employee-advance-balances', companyId] });
    },
  });

  if (lastRun) {
    return (
      <Card className="max-w-lg">
        <h3 className="font-semibold text-gray-900 mb-2">
          تم اعتماد دورة رواتب شهر {lastRun.periodMonth}/{lastRun.periodYear} بنجاح
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          إجمالي صافي الرواتب المصروفة {Number(lastRun.totalNetPay).toLocaleString('ar')} ر.س لعدد{' '}
          {lastRun.payslips.length} موظف
        </p>
        <Button onClick={() => setLastRun(null)}>عودة لتشغيل دورة جديدة</Button>
      </Card>
    );
  }

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">تشغيل دورة الرواتب — {companyName}</h2>
        <div className="flex items-end gap-2">
          <Field
            label="الشهر"
            type="number"
            min={1}
            max={12}
            value={periodMonth}
            onChange={(e) => setPeriodMonth(Number(e.target.value))}
            className="w-20"
          />
          <Field
            label="السنة"
            type="number"
            value={periodYear}
            onChange={(e) => setPeriodYear(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      <Card>
        <p className="text-sm text-gray-500 mb-3">
          راجع صافي راتب كل موظف نشط قبل الاعتماد. يمكنك تعديل خانة "خصم سلفة" لأي موظف عليه سلفة قائمة؛ سيُخصم
          المبلغ من راتبه ويُسدَّد تلقائياً من رصيد سلفته.
        </p>
        {!employees || employees.length === 0 ? (
          <p className="text-sm text-gray-400">لا يوجد موظفون نشطون.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">الموظف</th>
                <th className="pb-2 font-medium">الأساسي + البدلات</th>
                <th className="pb-2 font-medium">خصم التأمينات (GOSI)</th>
                <th className="pb-2 font-medium">رصيد السلفة</th>
                <th className="pb-2 font-medium">خصم سلفة هذه الدورة</th>
                <th className="pb-2 font-medium">صافي الراتب</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => {
                const advanceBalance = balances?.[p.employee.id] ?? 0;
                return (
                  <tr key={p.employee.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-900">{p.employee.fullName}</td>
                    <td className="py-2 text-gray-700">
                      {(p.basicSalary + p.allowances).toLocaleString('ar')}
                    </td>
                    <td className="py-2 text-gray-500">{p.gosiDeduction.toLocaleString('ar')}</td>
                    <td className={`py-2 ${advanceBalance > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {advanceBalance.toLocaleString('ar')}
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={deductions[p.employee.id] || ''}
                        onChange={(e) =>
                          setDeductions((prev) => ({ ...prev, [p.employee.id]: e.target.value }))
                        }
                        placeholder="0"
                        max={advanceBalance || undefined}
                        className="w-24 border border-gray-200 rounded px-2 py-1 text-center"
                      />
                    </td>
                    <td className="py-2 font-medium text-gray-900">{p.netPay.toLocaleString('ar')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {employees && employees.length > 0 && (
          <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              إجمالي صافي رواتب شهر {monthNames[periodMonth - 1]} {periodYear} لعدد {employees.length} موظف
            </span>
            <span className="font-bold text-gray-900">{totalNetPay.toLocaleString('ar')} ر.س</span>
          </div>
        )}

        {runMutation.isError && (
          <p className="text-sm text-red-600 mt-2">{extractErrorMessage(runMutation.error)}</p>
        )}

        <div className="mt-4">
          <Button
            disabled={!employees || employees.length === 0 || runMutation.isPending}
            onClick={() => runMutation.mutate()}
          >
            {runMutation.isPending ? 'جاري اعتماد الدورة...' : 'اعتماد وتشغيل دورة الرواتب لكل الموظفين'}
          </Button>
        </div>
      </Card>

      {previousRuns && previousRuns.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">دورات رواتب سابقة</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">الشهر</th>
                <th className="pb-2 font-medium">عدد الموظفين</th>
                <th className="pb-2 font-medium">إجمالي صافي الرواتب</th>
              </tr>
            </thead>
            <tbody>
              {previousRuns.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-900">
                    {monthNames[r.periodMonth - 1]} {r.periodYear}
                  </td>
                  <td className="py-2 text-gray-500">{r.payslips.length}</td>
                  <td className="py-2 text-gray-700">{Number(r.totalNetPay).toLocaleString('ar')} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
