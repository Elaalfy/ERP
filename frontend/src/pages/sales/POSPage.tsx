import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { usePostingAccounts } from '../../lib/usePostingAccounts';
import { useActiveFiscalPeriod } from '../../lib/useActiveFiscalPeriod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { SelectField } from '../../components/ui/SelectField';
import { Modal } from '../../components/ui/Modal';
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
  expectedCashSales?: number;
  countedCash?: number;
  cashVariance?: number;
}

interface CartLine {
  productId: string;
  nameAr: string;
  unitPrice: number;
  quantity: number;
}

const VAT_RATE = 0.15;

// قيمة مؤقتة لحين بناء شاشة المستخدمين وربطها فعلياً (الفترة المالية أصبحت تُجلب فعلياً الآن)
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
  const [closedShift, setClosedShift] = useState<Shift | null>(null);
  const { periodId, isError: periodError } = useActiveFiscalPeriod(companyId);

  const { data: shifts } = useQuery({
    queryKey: ['cashier-shifts', companyId],
    queryFn: async () => {
      const res = await api.get<Shift[]>('/sales/cashier-shifts', { params: { companyId } });
      return res.data;
    },
  });

  const openShift = shifts?.find((s) => s.status === 'open');

  // بعد الإغلاق الناجح نعرض نتيجة الفارق أولاً، ولا ننتقل تلقائياً لفتح وردية جديدة
  if (closedShift) {
    return (
      <ShiftClosedSummary
        shift={closedShift}
        onContinue={() => {
          setClosedShift(null);
          queryClient.invalidateQueries({ queryKey: ['cashier-shifts', companyId] });
        }}
      />
    );
  }

  if (!openShift) {
    return (
      <OpenShiftForm
        companyId={companyId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['cashier-shifts', companyId] })}
      />
    );
  }

  return (
    <SellingScreen
      companyId={companyId}
      companyName={companyName}
      accounts={accounts}
      shift={openShift}
      onShiftClosed={(shift) => setClosedShift(shift)}
    />
  );
}

function ShiftClosedSummary({ shift, onContinue }: { shift: Shift; onContinue: () => void }) {
  const variance = Number(shift.cashVariance ?? 0);
  const varianceLabel = variance === 0 ? 'متطابق تماماً' : variance > 0 ? 'زيادة في الصندوق' : 'عجز في الصندوق';
  const varianceColor = variance === 0 ? 'text-gray-700' : variance > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card className="max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-4">تم إغلاق الوردية</h3>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>المبلغ الافتتاحي</span>
          <span>{Number(shift.openingCash).toLocaleString('ar')} ر.س</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>المبيعات النقدية المسجلة</span>
          <span>{Number(shift.expectedCashSales ?? 0).toLocaleString('ar')} ر.س</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>النقد المعدود فعلياً</span>
          <span>{Number(shift.countedCash ?? 0).toLocaleString('ar')} ر.س</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
          <span>الفارق</span>
          <span className={varianceColor}>{variance.toLocaleString('ar')} ر.س</span>
        </div>
        <p className={`text-xs ${varianceColor}`}>{varianceLabel}</p>
      </div>
      <div className="mt-4">
        <Button onClick={onContinue}>فتح وردية جديدة</Button>
      </div>
    </Card>
  );
}

function CloseShiftModal({
  shiftId,
  onClose,
  onClosed,
}: {
  shiftId: string;
  onClose: () => void;
  onClosed: (shift: Shift) => void;
}) {
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<Shift>(`/sales/cashier-shifts/${shiftId}/close`, {
        countedCash: Number(countedCash),
        notes: notes || undefined,
      });
      return res.data;
    },
    onSuccess: (shift) => onClosed(shift),
  });

  return (
    <Modal title="إغلاق الوردية" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field
          label="النقد الفعلي الموجود في الدرج"
          type="number"
          value={countedCash}
          onChange={(e) => setCountedCash(e.target.value)}
          placeholder="0"
          autoFocus
        />
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">ملاحظات (اختياري)</span>
          <textarea
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button disabled={!countedCash || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'جاري الإغلاق...' : 'تأكيد الإغلاق'}
          </Button>
        </div>
      </div>
    </Modal>
  );
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
  shift,
  onShiftClosed,
}: {
  companyId: string;
  companyName: string;
  accounts: ReturnType<typeof usePostingAccounts>['accounts'];
  shift: Shift;
  onShiftClosed: (shift: Shift) => void;
}) {
  const shiftId = shift.id;
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [customerId, setCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

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
        periodId,
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
    cart.length > 0 &&
    (paymentMethod !== 'credit' || !!customerId) &&
    !checkoutMutation.isPending &&
    !!periodId;

  return (
    <div className="grid grid-cols-[1fr_360px] gap-6 h-full">
      {periodError && (
        <p className="col-span-2 text-sm text-red-600">
          لا توجد فترة مالية مفتوحة لهذه الشركة، يجب إنشاؤها أولاً من شاشة{' '}
          <code>الفترات المالية</code>.
        </p>
      )}
      {/* شبكة المنتجات */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">نقطة البيع — {companyName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              الوردية مفتوحة منذ{' '}
              {new Date(shift.openedAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })} — المبلغ
              الافتتاحي {Number(shift.openingCash).toLocaleString('ar')} ر.س
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Field
              label=""
              placeholder="ابحث عن منتج بالاسم أو الرمز..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="secondary" onClick={() => setShowCloseShiftModal(true)}>
              إغلاق الوردية
            </Button>
          </div>
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

      {showCloseShiftModal && (
        <CloseShiftModal
          shiftId={shiftId}
          onClose={() => setShowCloseShiftModal(false)}
          onClosed={(closed) => {
            setShowCloseShiftModal(false);
            onShiftClosed(closed);
          }}
        />
      )}
    </div>
  );
}
