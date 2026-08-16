import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { usePurchasingPostingAccounts } from '../../lib/usePurchasingPostingAccounts';
import { useActiveFiscalPeriod } from '../../lib/useActiveFiscalPeriod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PurchasingPostingAccountsSetup } from './PurchasingPostingAccountsSetup';
import { useAuth } from '../../context/AuthContext';

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

interface LedgerEntry {
  id: string;
  type: 'invoice' | 'payment' | 'adjustment';
  amount: string;
  note: string | null;
  createdAt: string;
}

export function SuppliersPage() {
  const { company } = useCompany();
  const { accounts, save, isComplete } = usePurchasingPostingAccounts(company?.id);

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  if (!isComplete) {
    return <PurchasingPostingAccountsSetup companyId={company.id} onSave={save} />;
  }

  return <SuppliersWorkspace companyId={company.id} accounts={accounts} />;
}

function SuppliersWorkspace({
  companyId,
  accounts,
}: {
  companyId: string;
  accounts: ReturnType<typeof usePurchasingPostingAccounts>['accounts'];
}) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: async () => {
      const res = await api.get<Supplier[]>('/purchasing/suppliers', { params: { companyId } });
      return res.data;
    },
  });

  const { data: balances } = useQuery({
    queryKey: ['supplier-balances', companyId, suppliers?.map((s) => s.id)],
    queryFn: async () => {
      if (!suppliers) return {};
      const entries = await Promise.all(
        suppliers.map(async (s) => {
          const res = await api.get<{ balance: number }>(`/purchasing/suppliers/${s.id}/balance`);
          return [s.id, res.data.balance] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    enabled: !!suppliers && suppliers.length > 0,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">الموردون</h2>
        <Button onClick={() => setShowAddModal(true)}>إضافة مورد جديد</Button>
      </div>

      <Card>
        {!suppliers || suppliers.length === 0 ? (
          <p className="text-sm text-gray-400">لا يوجد موردون بعد.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">الاسم</th>
                <th className="pb-2 font-medium">الجوال</th>
                <th className="pb-2 font-medium">الرصيد المستحق عليه للشركة</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const balance = balances?.[s.id] ?? 0;
                return (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-900">{s.name}</td>
                    <td className="py-2 text-gray-500">{s.phone || '—'}</td>
                    <td className={`py-2 font-medium ${balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {Number(balance).toLocaleString('ar')} ر.س
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" onClick={() => setSelectedSupplier(s)}>
                        عرض الحساب والسداد
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
        <AddSupplierModal
          companyId={companyId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
          }}
        />
      )}

      {selectedSupplier && (
        <SupplierLedgerModal
          companyId={companyId}
          supplier={selectedSupplier}
          accounts={accounts}
          onClose={() => setSelectedSupplier(null)}
          onPaid={() => {
            queryClient.invalidateQueries({ queryKey: ['supplier-balances', companyId] });
          }}
        />
      )}
    </div>
  );
}

export function AddSupplierModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: (supplier: Supplier) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<Supplier>('/purchasing/suppliers', {
        companyId,
        name,
        phone: phone || undefined,
      });
      return res.data;
    },
    onSuccess: (supplier) => onCreated(supplier),
  });

  return (
    <Modal title="إضافة مورد جديد" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="اسم المورد" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Field label="رقم الجوال (اختياري)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SupplierLedgerModal({
  companyId,
  supplier,
  accounts,
  onClose,
  onPaid,
}: {
  companyId: string;
  supplier: Supplier;
  accounts: ReturnType<typeof usePurchasingPostingAccounts>['accounts'];
  onClose: () => void;
  onPaid: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { periodId, isError: periodError } = useActiveFiscalPeriod(companyId);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const { data: ledger } = useQuery({
    queryKey: ['supplier-ledger', supplier.id],
    queryFn: async () => {
      const res = await api.get<LedgerEntry[]>(`/purchasing/suppliers/${supplier.id}/ledger`);
      return res.data;
    },
  });

  const { data: balanceData } = useQuery({
    queryKey: ['supplier-balance', supplier.id],
    queryFn: async () => {
      const res = await api.get<{ balance: number }>(`/purchasing/suppliers/${supplier.id}/balance`);
      return res.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/purchasing/suppliers/${supplier.id}/payments`, {
        companyId,
        amount: Number(payAmount),
        cashOrBankAccountId: accounts.cashOrBankAccountId,
        apAccountId: accounts.apAccountId,
        periodId,
        createdById: user!.id,
        note: payNote || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setPayAmount('');
      setPayNote('');
      queryClient.invalidateQueries({ queryKey: ['supplier-ledger', supplier.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-balance', supplier.id] });
      onPaid();
    },
  });

  const typeLabel: Record<LedgerEntry['type'], string> = {
    invoice: 'فاتورة شراء',
    payment: 'سداد دفعة',
    adjustment: 'تسوية',
  };

  return (
    <Modal title={`حساب المورد — ${supplier.name}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600">الرصيد المستحق حالياً</span>
          <span className="font-bold text-gray-900">
            {Number(balanceData?.balance ?? 0).toLocaleString('ar')} ر.س
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
          {ledger?.length === 0 && <p className="text-sm text-gray-400">لا توجد حركات بعد.</p>}
          {ledger?.map((l) => (
            <div key={l.id} className="flex justify-between text-xs border-b border-gray-50 pb-1">
              <div>
                <span className="text-gray-700">{typeLabel[l.type]}</span>
                {l.note && <span className="text-gray-400"> — {l.note}</span>}
              </div>
              <span className={Number(l.amount) > 0 ? 'text-red-600' : 'text-green-600'}>
                {Number(l.amount).toLocaleString('ar')}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">تسجيل سداد جديد (كامل أو جزئي)</p>
          <Field
            label="المبلغ المسدَّد"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="0"
          />
          <Field label="ملاحظة (اختياري)" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
          {periodError && (
            <p className="text-sm text-red-600">
              لا توجد فترة مالية مفتوحة لهذه الشركة، يجب إنشاؤها أولاً من شاشة{' '}
              <code>الفترات المالية</code>.
            </p>
          )}
          {payMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(payMutation.error)}</p>
          )}
          <Button
            disabled={!payAmount || Number(payAmount) <= 0 || payMutation.isPending || !periodId}
            onClick={() => payMutation.mutate()}
          >
            {payMutation.isPending ? 'جاري السداد...' : 'تأكيد السداد'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
