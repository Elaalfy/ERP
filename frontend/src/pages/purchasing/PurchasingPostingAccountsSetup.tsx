import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SelectField } from '../../components/ui/SelectField';
import type { PurchasingPostingAccounts } from '../../lib/usePurchasingPostingAccounts';

interface Account {
  id: string;
  code: string;
  nameAr: string;
}

const fields: { key: keyof PurchasingPostingAccounts; label: string }[] = [
  { key: 'cashOrBankAccountId', label: 'حساب النقدية/البنك (للشراء النقدي والسداد)' },
  { key: 'apAccountId', label: 'حساب ذمم الموردين الدائنة (للشراء الآجل)' },
  { key: 'vatInputAccountId', label: 'حساب ضريبة القيمة المضافة القابلة للخصم' },
  { key: 'inventoryAccountId', label: 'حساب المخزون' },
];

export function PurchasingPostingAccountsSetup({
  companyId,
  onSave,
}: {
  companyId: string;
  onSave: (accounts: PurchasingPostingAccounts) => void;
}) {
  const { data: accounts } = useQuery({
    queryKey: ['accounts', companyId],
    queryFn: async () => {
      const res = await api.get<Account[]>('/accounting/accounts', { params: { companyId } });
      return res.data;
    },
  });

  const [draft, setDraft] = useState<PurchasingPostingAccounts>({
    cashOrBankAccountId: '',
    apAccountId: '',
    vatInputAccountId: '',
    inventoryAccountId: '',
  });

  const isComplete = Object.values(draft).every((v) => v);

  return (
    <Card className="max-w-lg">
      <h3 className="font-semibold text-gray-900 mb-1">إعداد حسابات ترحيل المشتريات — مرة واحدة فقط</h3>
      <p className="text-sm text-gray-500 mb-4">
        هذه الحسابات ستُستخدم تلقائياً في كل فاتورة شراء وكل سداد لمورد من هذه الشركة.
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
