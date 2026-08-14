import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { useHrPostingAccounts } from '../../lib/useHrPostingAccounts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { HrPostingAccountsSetup } from './HrPostingAccountsSetup';

// قيم مؤقتة لحين بناء شاشات الفترات المالية والمستخدمين وربطها فعلياً (بنفس نمط نقطة البيع والمشتريات)
const PLACEHOLDER_PERIOD_ID = '8a4e76a3-0076-4c7b-bc6c-3f300a53486f';
const PLACEHOLDER_USER_ID = '1c5ae9bb-7d21-4228-a328-dedb49dba710';

export interface Employee {
  id: string;
  fullName: string;
  position: string | null;
  basicSalary: number;
  fixedAllowances: number;
  gosiEmployeeRate: number;
  isActive: boolean;
}

interface AdvanceLedgerEntry {
  id: string;
  type: 'advance' | 'deduction' | 'adjustment';
  amount: string;
  note: string | null;
  createdAt: string;
}

export function EmployeesPage() {
  const { company } = useCompany();
  const { accounts, save, isComplete } = useHrPostingAccounts(company?.id);

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  if (!isComplete) {
    return <HrPostingAccountsSetup companyId={company.id} onSave={save} />;
  }

  return <EmployeesWorkspace companyId={company.id} accounts={accounts} />;
}

function EmployeesWorkspace({
  companyId,
  accounts,
}: {
  companyId: string;
  accounts: ReturnType<typeof useHrPostingAccounts>['accounts'];
}) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: employees } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const res = await api.get<Employee[]>('/hr/employees', { params: { companyId } });
      return res.data;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">الموظفون</h2>
        <Button onClick={() => setShowAddModal(true)}>إضافة موظف جديد</Button>
      </div>

      <Card>
        {!employees || employees.length === 0 ? (
          <p className="text-sm text-gray-400">لا يوجد موظفون بعد.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">الاسم</th>
                <th className="pb-2 font-medium">الوظيفة</th>
                <th className="pb-2 font-medium">الراتب الأساسي</th>
                <th className="pb-2 font-medium">رصيد السلفة الحالي</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const balance = balances?.[e.id] ?? 0;
                return (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-900">{e.fullName}</td>
                    <td className="py-2 text-gray-500">{e.position || '—'}</td>
                    <td className="py-2 text-gray-700">{Number(e.basicSalary).toLocaleString('ar')} ر.س</td>
                    <td className={`py-2 font-medium ${balance > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {Number(balance).toLocaleString('ar')} ر.س
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" onClick={() => setSelectedEmployee(e)}>
                        السلف والحركة
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {showAddModal && (
        <AddEmployeeModal
          companyId={companyId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['employees', companyId] });
          }}
        />
      )}

      {selectedEmployee && (
        <AdvanceLedgerModal
          companyId={companyId}
          employee={selectedEmployee}
          accounts={accounts}
          onClose={() => setSelectedEmployee(null)}
          onChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['employee-advance-balances', companyId] });
          }}
        />
      )}
    </div>
  );
}

export function AddEmployeeModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: (employee: Employee) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [basicSalary, setBasicSalary] = useState('');
  const [fixedAllowances, setFixedAllowances] = useState('');
  const [gosiRatePercent, setGosiRatePercent] = useState('9.75');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<Employee>('/hr/employees', {
        companyId,
        fullName,
        position: position || undefined,
        hireDate,
        basicSalary: Number(basicSalary),
        fixedAllowances: fixedAllowances ? Number(fixedAllowances) : undefined,
        gosiEmployeeRate: gosiRatePercent ? Number(gosiRatePercent) / 100 : undefined,
      });
      return res.data;
    },
    onSuccess: (employee) => onCreated(employee),
  });

  return (
    <Modal title="إضافة موظف جديد" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="اسم الموظف" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        <Field label="الوظيفة (اختياري)" value={position} onChange={(e) => setPosition(e.target.value)} />
        <Field label="تاريخ التعيين" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
        <Field
          label="الراتب الأساسي"
          type="number"
          value={basicSalary}
          onChange={(e) => setBasicSalary(e.target.value)}
          placeholder="0"
        />
        <Field
          label="البدلات الثابتة (اختياري)"
          type="number"
          value={fixedAllowances}
          onChange={(e) => setFixedAllowances(e.target.value)}
          placeholder="0"
        />
        <Field
          label="نسبة التأمينات (GOSI) على الموظف ٪"
          type="number"
          value={gosiRatePercent}
          onChange={(e) => setGosiRatePercent(e.target.value)}
        />
        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button
            disabled={!fullName.trim() || !basicSalary || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AdvanceLedgerModal({
  companyId,
  employee,
  accounts,
  onClose,
  onChanged,
}: {
  companyId: string;
  employee: Employee;
  accounts: ReturnType<typeof useHrPostingAccounts>['accounts'];
  onClose: () => void;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [grantAmount, setGrantAmount] = useState('');
  const [grantNote, setGrantNote] = useState('');

  const { data: ledger } = useQuery({
    queryKey: ['employee-advance-ledger', employee.id],
    queryFn: async () => {
      const res = await api.get<AdvanceLedgerEntry[]>(`/hr/employees/${employee.id}/advances/ledger`);
      return res.data;
    },
  });

  const { data: balanceData } = useQuery({
    queryKey: ['employee-advance-balance', employee.id],
    queryFn: async () => {
      const res = await api.get<{ balance: number }>(`/hr/employees/${employee.id}/advances/balance`);
      return res.data;
    },
  });

  const grantMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/hr/employees/${employee.id}/advances`, {
        companyId,
        amount: Number(grantAmount),
        cashOrBankAccountId: accounts.cashOrBankAccountId,
        employeeAdvancesAccountId: accounts.employeeAdvancesAccountId,
        periodId: PLACEHOLDER_PERIOD_ID,
        createdById: PLACEHOLDER_USER_ID,
        note: grantNote || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setGrantAmount('');
      setGrantNote('');
      queryClient.invalidateQueries({ queryKey: ['employee-advance-ledger', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['employee-advance-balance', employee.id] });
      onChanged();
    },
  });

  const typeLabel: Record<AdvanceLedgerEntry['type'], string> = {
    advance: 'صرف سلفة',
    deduction: 'خصم من الراتب (سداد)',
    adjustment: 'تسوية',
  };

  return (
    <Modal title={`سلف الموظف — ${employee.fullName}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600">رصيد السلفة المستحق على الموظف</span>
          <span className="font-bold text-gray-900">
            {Number(balanceData?.balance ?? 0).toLocaleString('ar')} ر.س
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
          {ledger?.length === 0 && <p className="text-sm text-gray-400">لا توجد حركات سلف بعد.</p>}
          {ledger?.map((l) => (
            <div key={l.id} className="flex justify-between text-xs border-b border-gray-50 pb-1">
              <div>
                <span className="text-gray-700">{typeLabel[l.type]}</span>
                {l.note && <span className="text-gray-400"> — {l.note}</span>}
              </div>
              <span className={Number(l.amount) > 0 ? 'text-amber-600' : 'text-green-600'}>
                {Number(l.amount).toLocaleString('ar')}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">صرف سلفة جديدة</p>
          <Field
            label="مبلغ السلفة"
            type="number"
            value={grantAmount}
            onChange={(e) => setGrantAmount(e.target.value)}
            placeholder="0"
          />
          <Field label="ملاحظة (اختياري)" value={grantNote} onChange={(e) => setGrantNote(e.target.value)} />
          {grantMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(grantMutation.error)}</p>
          )}
          <Button
            disabled={!grantAmount || Number(grantAmount) <= 0 || grantMutation.isPending}
            onClick={() => grantMutation.mutate()}
          >
            {grantMutation.isPending ? 'جاري الصرف...' : 'تأكيد صرف السلفة'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
