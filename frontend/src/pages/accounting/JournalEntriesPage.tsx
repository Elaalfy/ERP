import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SelectField } from '../../components/ui/SelectField';
import { Field } from '../../components/ui/Field';

interface Account {
  id: string;
  code: string;
  nameAr: string;
}

interface JournalLine {
  account: { id: string; nameAr: string; code: string };
  debit: string;
  credit: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType: string;
  lines: JournalLine[];
}

const sourceTypeLabels: Record<string, string> = {
  sale: 'مبيعات',
  collection: 'تحصيل',
  purchase: 'مشتريات',
  manual: 'يدوي',
  adjustment: 'تسوية',
};

interface LineDraft {
  accountId: string;
  debit: string;
  credit: string;
}

export function JournalEntriesPage() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries', company?.id],
    queryFn: async () => {
      const res = await api.get<JournalEntry[]>('/accounting/journal-entries', {
        params: { companyId: company!.id },
      });
      return res.data;
    },
    enabled: !!company,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts', company?.id],
    queryFn: async () => {
      const res = await api.get<Account[]>('/accounting/accounts', { params: { companyId: company!.id } });
      return res.data;
    },
    enabled: !!company,
  });

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">القيود المحاسبية — {company.name}</h2>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'إلغاء' : '+ قيد يدوي جديد'}</Button>
      </div>

      {showForm && accounts && (
        <NewJournalEntryForm
          companyId={company.id}
          accounts={accounts}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', company.id] });
            setShowForm(false);
          }}
        />
      )}

      <Card>
        {isLoading ? (
          <p className="text-gray-500 text-sm">جاري التحميل...</p>
        ) : !entries || entries.length === 0 ? (
          <p className="text-gray-400 text-sm">لا توجد قيود بعد.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">رقم القيد</th>
                <th className="pb-2 font-medium">التاريخ</th>
                <th className="pb-2 font-medium">المصدر</th>
                <th className="pb-2 font-medium">الوصف</th>
                <th className="pb-2 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const total = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
                return (
                  <tr key={entry.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-xs text-gray-600">{entry.entryNumber}</td>
                    <td className="py-2 text-gray-600">{entry.entryDate}</td>
                    <td className="py-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {sourceTypeLabels[entry.sourceType] ?? entry.sourceType}
                      </span>
                    </td>
                    <td className="py-2 text-gray-700">{entry.description}</td>
                    <td className="py-2 font-medium text-gray-900">{total.toLocaleString('ar')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function NewJournalEntryForm({
  companyId,
  accounts,
  onSuccess,
}: {
  companyId: string;
  accounts: Account[];
  onSuccess: () => void;
}) {
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineDraft[]>([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);

  // مجموع مدين ودائن يُحسبان فورياً في الواجهة لتنبيه المستخدم قبل محاولة الإرسال للسيرفر
  const totalDebit = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0), [lines]);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      // بيانات ثابتة مؤقتة (الفترة والمستخدم) لحين بناء شاشات إدارتها
      await api.post('/accounting/journal-entries', {
        companyId,
        periodId: PLACEHOLDER_PERIOD_ID,
        createdById: PLACEHOLDER_USER_ID,
        entryDate,
        sourceType: 'manual',
        description,
        lines: lines
          .filter((l) => l.accountId)
          .map((l) => ({ accountId: l.accountId, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      });
    },
    onSuccess,
  });

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">قيد يدوي جديد</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="التاريخ" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <Field label="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="بيان القيد" />
      </div>

      <div className="flex flex-col gap-2">
        {lines.map((line, index) => (
          <div key={index} className="grid grid-cols-[1fr_120px_120px_auto] gap-2 items-end">
            <SelectField
              label={index === 0 ? 'الحساب' : ''}
              value={line.accountId}
              onChange={(e) => updateLine(index, { accountId: e.target.value })}
            >
              <option value="">اختر حساباً</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.nameAr}
                </option>
              ))}
            </SelectField>
            <Field
              label={index === 0 ? 'مدين' : ''}
              type="number"
              value={line.debit}
              onChange={(e) => updateLine(index, { debit: e.target.value, credit: e.target.value ? '' : line.credit })}
            />
            <Field
              label={index === 0 ? 'دائن' : ''}
              type="number"
              value={line.credit}
              onChange={(e) => updateLine(index, { credit: e.target.value, debit: e.target.value ? '' : line.debit })}
            />
            <Button
              variant="ghost"
              className="text-red-500"
              onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
              disabled={lines.length <= 2}
            >
              حذف
            </Button>
          </div>
        ))}
      </div>

      <button
        className="text-sm text-indigo-600 mt-2"
        onClick={() => setLines((prev) => [...prev, { accountId: '', debit: '', credit: '' }])}
      >
        + إضافة سطر
      </button>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-500">مدين: </span>
          <span className="font-medium">{totalDebit.toLocaleString('ar')}</span>
          <span className="text-gray-500 mr-4">دائن: </span>
          <span className="font-medium">{totalCredit.toLocaleString('ar')}</span>
          {!isBalanced && (
            <span className="text-red-600 mr-3 text-xs">⚠ القيد غير متوازن</span>
          )}
        </div>
        <Button disabled={!isBalanced || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'جاري الحفظ...' : 'حفظ القيد'}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600 mt-2">{extractErrorMessage(mutation.error)}</p>
      )}
    </Card>
  );
}

// قيم مؤقتة لحين بناء شاشات الفترات المالية والمستخدمين وربطها فعلياً بالواجهة
const PLACEHOLDER_PERIOD_ID = '8a4e76a3-0076-4c7b-bc6c-3f300a53486f';
const PLACEHOLDER_USER_ID = '1c5ae9bb-7d21-4228-a328-dedb49dba710';
