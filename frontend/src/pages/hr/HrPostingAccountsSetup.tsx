import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SelectField } from '../../components/ui/SelectField';
import type { HrPostingAccounts } from '../../lib/useHrPostingAccounts';

interface Account {
  id: string;
  code: string;
  nameAr: string;
}

const fields: { key: keyof HrPostingAccounts; label: string }[] = [
  { key: 'salaryExpenseAccountId', label: 'حساب مصروف الرواتب (مدين في كل دورة)' },
  { key: 'gosiPayableAccountId', label: 'حساب التأمينات الاجتماعية المستحقة (GOSI) (دائن)' },
  { key: 'salariesPayableAccountId', label: 'حساب الرواتب المستحقة الدفع للموظفين (دائن)' },
  { key: 'employeeAdvancesAccountId', label: 'حساب ذمم سلف الموظفين (أصل)' },
  { key: 'cashOrBankAccountId', label: 'حساب النقدية/البنك (لصرف السلف)' },
];

export function HrPostingAccountsSetup({
  companyId,
  onSave,
}: {
  companyId: string;
  onSave: (accounts: HrPostingAccounts) => void;
}) {
  const { data: accounts } = useQuery({
    queryKey: ['accounts', companyId],
    queryFn: async () => {
      const res = await api.get<Account[]>('/accounting/accounts', { params: { companyId } });
      return res.data;
    },
  });

  const [draft, setDraft] = useState<HrPostingAccounts>({
    salaryExpenseAccountId: '',
    gosiPayableAccountId: '',
    salariesPayableAccountId: '',
    employeeAdvancesAccountId: '',
    cashOrBankAccountId: '',
  });

  const isComplete = Object.values(draft).every((v) => v);

  return (
    <Card className="max-w-lg">
      <h3 className="font-semibold text-gray-900 mb-1">إعداد حسابات ترحيل الرواتب والسلف — مرة واحدة فقط</h3>
      <p className="text-sm text-gray-500 mb-4">
        هذه الحسابات ستُستخدم تلقائياً في كل دورة رواتب وكل سلفة تُصرف لموظف من هذه الشركة.
      </p>
      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <SelectField
            key={f.key}
            label={f.label}
            value={draft[f.key]}
            onChange={(e) => setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
          >
            <option value="">اختر حساباً</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.nameAr}
              </option>
            ))}
          </SelectField>
        ))}
      </div>
      <div className="mt-4">
        <Button disabled={!isComplete} onClick={() => onSave(draft)}>
          حفظ ومتابعة
        </Button>
      </div>
    </Card>
  );
}
