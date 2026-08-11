import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SelectField } from '../../components/ui/SelectField';
import type { PostingAccounts } from '../../lib/usePostingAccounts';

interface Account {
  id: string;
  code: string;
  nameAr: string;
}

const fields: { key: keyof PostingAccounts; label: string }[] = [
  { key: 'cashOrBankAccountId', label: 'حساب النقدية/البنك' },
  { key: 'revenueAccountId', label: 'حساب إيرادات المبيعات' },
  { key: 'vatPayableAccountId', label: 'حساب ضريبة القيمة المضافة المستحقة' },
  { key: 'arAccountId', label: 'حساب ذمم العملاء (للبيع الآجل)' },
  { key: 'cogsAccountId', label: 'حساب تكلفة البضاعة المباعة' },
  { key: 'inventoryAccountId', label: 'حساب المخزون' },
];

export function PostingAccountsSetup({
  companyId,
  onSave,
}: {
  companyId: string;
  onSave: (accounts: PostingAccounts) => void;
}) {
  const { data: accounts } = useQuery({
    queryKey: ['accounts', companyId],
    queryFn: async () => {
      const res = await api.get<Account[]>('/accounting/accounts', { params: { companyId } });
      return res.data;
    },
  });

  const [draft, setDraft] = useState<PostingAccounts>({
    cashOrBankAccountId: '',
    revenueAccountId: '',
    vatPayableAccountId: '',
    arAccountId: '',
    cogsAccountId: '',
    inventoryAccountId: '',
  });

  const isComplete = Object.values(draft).every((v) => v);

  return (
    <Card className="max-w-lg">
      <h3 className="font-semibold text-gray-900 mb-1">إعداد حسابات الترحيل — مرة واحدة فقط</h3>
      <p className="text-sm text-gray-500 mb-4">
        هذه الحسابات ستُستخدم تلقائياً في كل فاتورة بيع من نقطة البيع لهذه الشركة.
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
