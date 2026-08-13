import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { usePurchasingPostingAccounts } from '../../lib/usePurchasingPostingAccounts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { SelectField } from '../../components/ui/SelectField';
import { Modal } from '../../components/ui/Modal';
import { PurchasingPostingAccountsSetup } from './PurchasingPostingAccountsSetup';
import { AddSupplierModal } from './SuppliersPage';

const VAT_RATE = 0.15;
// قيم مؤقتة لحين بناء شاشات الفترات المالية والمستخدمين وربطها فعلياً (بنفس نمط نقطة البيع)
const PLACEHOLDER_PERIOD_ID = '8a4e76a3-0076-4c7b-bc6c-3f300a53486f';
const PLACEHOLDER_USER_ID = '1c5ae9bb-7d21-4228-a328-dedb49dba710';

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  salePrice: number;
}

interface PurchaseCartLine {
  productId: string;
  nameAr: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseInvoicePage() {
  const { company } = useCompany();
  const { accounts, save, isComplete } = usePurchasingPostingAccounts(company?.id);

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  if (!isComplete) {
    return <PurchasingPostingAccountsSetup companyId={company.id} onSave={save} />;
  }

  return <PurchaseInvoiceWorkspace companyId={company.id} companyName={company.name} accounts={accounts} />;
}

function PurchaseInvoiceWorkspace({
  companyId,
  companyName,
  accounts,
}: {
  companyId: string;
  companyName: string;
  accounts: ReturnType<typeof usePurchasingPostingAccounts>['accounts'];
}) {
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<PurchaseCartLine[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'credit'>('credit');
  const [productSearch, setProductSearch] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    supplierId: string;
  } | null>(null);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: async () => {
      const res = await api.get<Supplier[]>('/purchasing/suppliers', { params: { companyId } });
      return res.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products', companyId],
    queryFn: async () => {
      const res = await api.get<Product[]>('/inventory/products', { params: { companyId } });
      return res.data;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    return products.filter(
      (p) => p.nameAr.includes(productSearch) || p.sku.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [products, productSearch]);

  const subtotal = cart.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = subtotal + vatAmount;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, nameAr: product.nameAr, sku: product.sku, quantity: 1, unitCost: 0 }];
    });
  }

  function updateLine(productId: string, patch: Partial<PurchaseCartLine>) {
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/purchasing/invoices', {
        companyId,
        supplierId,
        supplierInvoiceRef: supplierInvoiceRef || undefined,
        paymentMethod,
        vatRate: VAT_RATE,
        periodId: PLACEHOLDER_PERIOD_ID,
        createdById: PLACEHOLDER_USER_ID,
        ...accounts,
        lines: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      });
      return res.data as { id: string; invoiceNumber: string; totalAmount: number; supplierId: string };
    },
    onSuccess: (data) => {
      setCreatedInvoice(data);
      setCart([]);
      setSupplierInvoiceRef('');
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-balances', companyId] });
    },
  });

  const linesValid = cart.length > 0 && cart.every((l) => l.quantity > 0 && l.unitCost > 0);
  const canSubmit = !!supplierId && linesValid && !createMutation.isPending;

  if (createdInvoice) {
    return (
      <PostSaveScreen
        companyId={companyId}
        invoice={createdInvoice}
        paymentMethod={paymentMethod}
        accounts={accounts}
        onDone={() => setCreatedInvoice(null)}
      />
    );
  }

  return (
    <div className="grid grid-cols-[1fr_380px] gap-6 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">فاتورة شراء جديدة — {companyName}</h2>
          <Field
            label=""
            placeholder="ابحث عن منتج بالاسم أو الرمز..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowAddProduct(true)}>
            + إضافة صنف جديد
          </Button>
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
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="text-sm text-gray-400 col-span-3">لا توجد منتجات مطابقة. أضف صنفاً جديداً.</p>
          )}
        </div>
      </div>

      <Card className="flex flex-col h-fit sticky top-4">
        <h3 className="font-semibold text-gray-900 mb-3">سطور فاتورة الشراء</h3>

        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SelectField label="المورد" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">اختر مورداً</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button variant="secondary" onClick={() => setShowAddSupplier(true)}>
              + جديد
            </Button>
          </div>
          <Field
            label="رقم فاتورة المورد (مرجعي، اختياري)"
            value={supplierInvoiceRef}
            onChange={(e) => setSupplierInvoiceRef(e.target.value)}
          />
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">أضف أصنافاً من القائمة.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {cart.map((l) => (
              <div key={l.productId} className="flex items-center gap-2 text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-700 flex-1">{l.nameAr}</span>
                <input
                  type="number"
                  value={l.quantity}
                  onChange={(e) => updateLine(l.productId, { quantity: Number(e.target.value) })}
                  className="w-14 border border-gray-200 rounded px-1 py-0.5 text-center"
                  placeholder="كمية"
                />
                <input
                  type="number"
                  value={l.unitCost || ''}
                  onChange={(e) => updateLine(l.productId, { unitCost: Number(e.target.value) })}
                  className="w-20 border border-gray-200 rounded px-1 py-0.5 text-center"
                  placeholder="تكلفة الوحدة"
                />
                <span className="w-16 text-left font-medium">
                  {(l.unitCost * l.quantity).toLocaleString('ar')}
                </span>
                <button onClick={() => removeLine(l.productId)} className="text-gray-300 hover:text-red-500">
                  ×
                </button>
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
            <span>ضريبة القيمة المضافة القابلة للخصم (15٪)</span>
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
            <option value="credit">آجل (ذمم موردين)</option>
            <option value="cash">نقدي</option>
            <option value="bank">تحويل بنكي</option>
          </SelectField>

          <Button disabled={!canSubmit} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ فاتورة الشراء'}
          </Button>

          {createMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(createMutation.error)}</p>
          )}
        </div>
      </Card>

      {showAddSupplier && (
        <AddSupplierModal
          companyId={companyId}
          onClose={() => setShowAddSupplier(false)}
          onCreated={(supplier) => {
            setShowAddSupplier(false);
            setSupplierId(supplier.id);
            queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
          }}
        />
      )}

      {showAddProduct && (
        <AddProductModal
          companyId={companyId}
          onClose={() => setShowAddProduct(false)}
          onCreated={(product) => {
            setShowAddProduct(false);
            queryClient.invalidateQueries({ queryKey: ['products', companyId] });
            addToCart(product);
          }}
        />
      )}
    </div>
  );
}

function AddProductModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const [sku, setSku] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [salePrice, setSalePrice] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<Product>('/inventory/products', {
        companyId,
        sku,
        nameAr,
        salePrice: Number(salePrice),
      });
      return res.data;
    },
    onSuccess: (product) => onCreated(product),
  });

  return (
    <Modal title="إضافة صنف جديد" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="اسم الصنف" value={nameAr} onChange={(e) => setNameAr(e.target.value)} autoFocus />
        <Field label="رمز الصنف (SKU)" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Field
          label="سعر البيع المبدئي (يمكن تعديله لاحقاً)"
          type="number"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="0"
        />
        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button
            disabled={!nameAr.trim() || !sku.trim() || !salePrice || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ وإضافة للفاتورة'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PostSaveScreen({
  companyId,
  invoice,
  paymentMethod,
  accounts,
  onDone,
}: {
  companyId: string;
  invoice: { id: string; invoiceNumber: string; totalAmount: number; supplierId: string };
  paymentMethod: 'cash' | 'bank' | 'credit';
  accounts: ReturnType<typeof usePurchasingPostingAccounts>['accounts'];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [payAmount, setPayAmount] = useState(String(invoice.totalAmount));
  const [paid, setPaid] = useState(false);

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/purchasing/suppliers/${invoice.supplierId}/payments`, {
        companyId,
        amount: Number(payAmount),
        cashOrBankAccountId: accounts.cashOrBankAccountId,
        apAccountId: accounts.apAccountId,
        periodId: PLACEHOLDER_PERIOD_ID,
        createdById: PLACEHOLDER_USER_ID,
        note: `سداد فوري لفاتورة الشراء ${invoice.invoiceNumber}`,
      });
      return res.data as { newBalance: number };
    },
    onSuccess: () => {
      setPaid(true);
      queryClient.invalidateQueries({ queryKey: ['supplier-balances', companyId] });
    },
  });

  return (
    <Card className="max-w-md">
      <h3 className="font-semibold text-gray-900 mb-2">تم حفظ فاتورة الشراء {invoice.invoiceNumber} بنجاح</h3>
      <p className="text-sm text-gray-500 mb-4">
        إجمالي الفاتورة {Number(invoice.totalAmount).toLocaleString('ar')} ر.س
      </p>

      {paymentMethod === 'credit' && !paid && (
        <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">
            الفاتورة آجلة وأُضيفت لذمة المورد. يمكنك سداد كامل المبلغ أو جزء منه الآن مباشرة:
          </p>
          <Field
            label="المبلغ المراد سداده الآن"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          {payMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(payMutation.error)}</p>
          )}
          <div className="flex gap-2">
            <Button
              disabled={!payAmount || Number(payAmount) <= 0 || payMutation.isPending}
              onClick={() => payMutation.mutate()}
            >
              {payMutation.isPending ? 'جاري السداد...' : 'تأكيد السداد الآن'}
            </Button>
            <Button variant="secondary" onClick={onDone}>
              السداد لاحقاً
            </Button>
          </div>
        </div>
      )}

      {(paymentMethod !== 'credit' || paid) && (
        <div className="flex flex-col gap-2">
          {paid && <p className="text-sm text-green-600">تم تسجيل السداد بنجاح.</p>}
          <Button onClick={onDone}>فاتورة شراء جديدة</Button>
        </div>
      )}
    </Card>
  );
}
