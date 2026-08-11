import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { usePostingAccounts } from '../../lib/usePostingAccounts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { SelectField } from '../../components/ui/SelectField';
import { PostingAccountsSetup } from './PostingAccountsSetup';

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  salePrice: number;
}

interface Customer {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  status: 'open' | 'closed';
  openingCash: number;
  openedAt: string;
}

interface CartLine {
  productId: string;
  nameAr: string;
  unitPrice: number;
  quantity: number;
}

const VAT_RATE = 0.15;

// قيم مؤقتة لحين بناء شاشات الفترات المالية والمستخدمين وربطها فعلياً
const PLACEHOLDER_PERIOD_ID = '8a4e76a3-0076-4c7b-bc6c-3f300a53486f';
const PLACEHOLDER_USER_ID = '1c5ae9bb-7d21-4228-a328-dedb49dba710';

export function POSPage() {
  const { company } = useCompany();
  const { accounts, save, isComplete } = usePostingAccounts(company?.id);

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  if (!isComplete) {
    return <PostingAccountsSetup companyId={company.id} onSave={save} />;
  }

  return <POSWorkspace companyId={company.id} companyName={company.name} accounts={accounts} />;
}

function POSWorkspace({
  companyId,
  companyName,
  accounts,
}: {
  companyId: string;
  companyName: string;
  accounts: ReturnType<typeof usePostingAccounts>['accounts'];
}) {
  const queryClient = useQueryClient();

  const { data: shifts } = useQuery({
    queryKey: ['cashier-shifts', companyId],
    queryFn: async () => {
      const res = await api.get<Shift[]>('/sales/cashier-shifts', { params: { companyId } });
      return res.data;
    },
  });

  const openShift = shifts?.find((s) => s.status === 'open');

  if (!openShift) {
    return (
      <OpenShiftForm
        companyId={companyId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['cashier-shifts', companyId] })}
      />
    );
  }

  return <SellingScreen companyId={companyId} companyName={companyName} accounts={accounts} shiftId={openShift.id} />;
}

function OpenShiftForm({ companyId, onSuccess }: { companyId: string; onSuccess: () => void }) {
  const [openingCash, setOpeningCash] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/sales/cashier-shifts/open', {
        companyId,
        cashierId: PLACEHOLDER_USER_ID,
        openingCash: Number(openingCash),
      });
    },
    onSuccess,
  });

  return (
    <Card className="max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-4">فتح وردية جديدة</h3>
      <Field
        label="المبلغ الافتتاحي في الدرج"
        type="number"
        value={openingCash}
        onChange={(e) => setOpeningCash(e.target.value)}
        placeholder="0"
      />
      {mutation.isError && <p className="text-sm text-red-600 mt-2">{extractErrorMessage(mutation.error)}</p>}
      <div className="mt-4">
        <Button disabled={!openingCash || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'جاري الفتح...' : 'فتح الوردية'}
        </Button>
      </div>
    </Card>
  );
}

function SellingScreen({
  companyId,
  companyName,
  accounts,
  shiftId,
}: {
  companyId: string;
  companyName: string;
  accounts: ReturnType<typeof usePostingAccounts>['accounts'];
  shiftId: string;
}) {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [customerId, setCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: products } = useQuery({
    queryKey: ['products', companyId],
    queryFn: async () => {
      const res = await api.get<Product[]>('/inventory/products', { params: { companyId } });
      return res.data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', companyId],
    queryFn: async () => {
      const res = await api.get<Customer[]>('/sales/customers', { params: { companyId } });
      return res.data;
    },
    enabled: paymentMethod === 'credit',
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    return products.filter(
      (p) => p.nameAr.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase()),
    );
  }, [products, search]);

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = subtotal + vatAmount;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, nameAr: product.nameAr, unitPrice: Number(product.salePrice), quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  }

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/sales/invoices', {
        companyId,
        customerId: paymentMethod === 'credit' ? customerId : undefined,
        paymentMethod,
        vatRate: VAT_RATE,
        periodId: PLACEHOLDER_PERIOD_ID,
        createdById: PLACEHOLDER_USER_ID,
        shiftId,
        ...accounts,
        lines: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      return res.data as { invoiceNumber: string };
    },
    onSuccess: (data) => {
      setSuccessMessage(`تم إصدار الفاتورة ${data.invoiceNumber} بنجاح`);
      setCart([]);
      setCustomerId('');
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      setTimeout(() => setSuccessMessage(''), 4000);
    },
  });

  const canCheckout =
    cart.length > 0 && (paymentMethod !== 'credit' || !!customerId) && !checkoutMutation.isPending;

  return (
    <div className="grid grid-cols-[1fr_360px] gap-6 h-full">
      {/* شبكة المنتجات */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">نقطة البيع — {companyName}</h2>
          <Field
            label=""
            placeholder="ابحث عن منتج بالاسم أو الرمز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="text-right bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-sm transition-all"
            >
              <p className="font-medium text-gray-900 text-sm">{p.nameAr}</p>
              <p className="text-xs text-gray-400 mt-1">{p.sku}</p>
              <p className="text-indigo-600 font-semibold mt-2">{Number(p.salePrice).toLocaleString('ar')} ر.س</p>
            </button>
          ))}
        </div>
      </div>

      {/* السلة */}
      <Card className="flex flex-col h-fit sticky top-4">
        <h3 className="font-semibold text-gray-900 mb-3">السلة</h3>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-400">أضف منتجات من القائمة.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {cart.map((l) => (
              <div key={l.productId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex-1">{l.nameAr}</span>
                <input
                  type="number"
                  value={l.quantity}
                  onChange={(e) => updateQuantity(l.productId, Number(e.target.value))}
                  className="w-14 border border-gray-200 rounded px-1 py-0.5 text-center"
                />
                <span className="w-16 text-left font-medium">{(l.unitPrice * l.quantity).toLocaleString('ar')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 pt-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>الإجمالي قبل الضريبة</span>
            <span>{subtotal.toLocaleString('ar')}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>ضريبة القيمة المضافة (15٪)</span>
            <span>{vatAmount.toLocaleString('ar')}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
            <span>الإجمالي</span>
            <span>{total.toLocaleString('ar')}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <SelectField
            label="طريقة الدفع"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
          >
            <option value="cash">نقدي</option>
            <option value="card">بطاقة</option>
            <option value="credit">آجل</option>
          </SelectField>

          {paymentMethod === 'credit' && (
            <SelectField label="العميل" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">اختر عميلاً</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          )}

          <Button disabled={!canCheckout} onClick={() => checkoutMutation.mutate()}>
            {checkoutMutation.isPending ? 'جاري الإصدار...' : 'إتمام البيع'}
          </Button>

          {checkoutMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(checkoutMutation.error)}</p>
          )}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        </div>
      </Card>
    </div>
  );
}
