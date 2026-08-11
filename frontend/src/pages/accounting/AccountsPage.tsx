import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { SelectField } from '../../components/ui/SelectField';

interface Account {
  id: string;
  parentId: string | null;
  code: string;
  nameAr: string;
  accountType: string;
  normalBalance: string;
  isGroup: boolean;
}

interface Template {
  id: string;
  name: string;
}

const accountTypeLabels: Record<string, string> = {
  asset: 'أصول',
  liability: 'خصوم',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

// بناء شجرة هرمية من قائمة مسطّحة اعتماداً على parentId
function buildTree(accounts: Account[]): (Account & { children: Account[] })[] {
  const map = new Map<string, Account & { children: Account[] }>();
  accounts.forEach((a) => map.set(a.id, { ...a, children: [] }));
  const roots: (Account & { children: Account[] })[] = [];
  map.forEach((a) => {
    if (a.parentId && map.has(a.parentId)) {
      map.get(a.parentId)!.children.push(a);
    } else {
      roots.push(a);
    }
  });
  return roots;
}

function AccountNode({ account }: { account: Account & { children: Account[] } }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = account.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded-lg">
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-5 text-gray-400 text-xs shrink-0"
          >
            {expanded ? '▾' : '◂'}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <span className="text-xs text-gray-400 font-mono w-16 shrink-0">{account.code}</span>
        <span className={`text-sm ${account.isGroup ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {account.nameAr}
        </span>
        <span className="text-xs text-gray-400 mr-auto">{accountTypeLabels[account.accountType]}</span>
      </div>
      {expanded && hasChildren && (
        <div className="mr-6 border-r border-gray-100 pr-2">
          {account.children.map((child) => (
            <AccountNode key={child.id} account={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountsPage() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', company?.id],
    queryFn: async () => {
      const res = await api.get<Account[]>('/accounting/accounts', { params: { companyId: company!.id } });
      return res.data;
    },
    enabled: !!company,
  });

  const { data: templates } = useQuery({
    queryKey: ['coa-templates'],
    queryFn: async () => {
      const res = await api.get<Template[]>('/accounting/accounts/templates');
      return res.data;
    },
  });

  const copyTemplateMutation = useMutation({
    mutationFn: async () => {
      await api.post('/accounting/accounts/copy-template', {
        companyId: company!.id,
        templateId: selectedTemplateId,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts', company?.id] }),
  });

  const createAccountMutation = useMutation({
    mutationFn: async (payload: {
      code: string;
      nameAr: string;
      accountType: string;
      normalBalance: string;
      parentId?: string;
    }) => {
      await api.post('/accounting/accounts', { companyId: company!.id, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', company?.id] });
      setShowManualForm(false);
    },
  });

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  const tree = accounts ? buildTree(accounts) : [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">شجرة الحسابات — {company.name}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowManualForm((v) => !v)}>
            + حساب يدوي
          </Button>
        </div>
      </div>

      {accounts && accounts.length === 0 && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">لا توجد شجرة حسابات لهذه الشركة بعد</p>
            <p className="text-sm text-gray-500">ابدأ بنسخ قالب جاهز أو أضف حسابات يدوياً</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">اختر قالباً</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button
              disabled={!selectedTemplateId || copyTemplateMutation.isPending}
              onClick={() => copyTemplateMutation.mutate()}
            >
              {copyTemplateMutation.isPending ? 'جاري النسخ...' : 'نسخ القالب'}
            </Button>
          </div>
        </Card>
      )}

      {copyTemplateMutation.isError && (
        <p className="text-sm text-red-600">{extractErrorMessage(copyTemplateMutation.error)}</p>
      )}

      {showManualForm && (
        <ManualAccountForm
          accounts={accounts ?? []}
          onSubmit={(payload) => createAccountMutation.mutate(payload)}
          isPending={createAccountMutation.isPending}
          error={createAccountMutation.isError ? extractErrorMessage(createAccountMutation.error) : null}
        />
      )}

      <Card>
        {isLoading ? (
          <p className="text-gray-500 text-sm">جاري التحميل...</p>
        ) : tree.length === 0 ? (
          <p className="text-gray-400 text-sm">لا توجد حسابات بعد.</p>
        ) : (
          <div>
            {tree.map((account) => (
              <AccountNode key={account.id} account={account} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ManualAccountForm({
  accounts,
  onSubmit,
  isPending,
  error,
}: {
  accounts: Account[];
  onSubmit: (payload: {
    code: string;
    nameAr: string;
    accountType: string;
    normalBalance: string;
    parentId?: string;
  }) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [accountType, setAccountType] = useState('asset');
  const [normalBalance, setNormalBalance] = useState('debit');
  const [parentId, setParentId] = useState('');

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">إضافة حساب يدوي</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="رقم الحساب" value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: 1110" />
        <Field label="اسم الحساب" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: الصندوق" />
        <SelectField label="نوع الحساب" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          {Object.entries(accountTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="الطبيعة" value={normalBalance} onChange={(e) => setNormalBalance(e.target.value)}>
          <option value="debit">مدين</option>
          <option value="credit">دائن</option>
        </SelectField>
        <SelectField label="الحساب الأب (اختياري)" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">بدون (حساب رئيسي)</option>
          {accounts
            .filter((a) => a.isGroup)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.nameAr}
              </option>
            ))}
        </SelectField>
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <div className="mt-4">
        <Button
          disabled={!code || !nameAr || isPending}
          onClick={() =>
            onSubmit({ code, nameAr, accountType, normalBalance, parentId: parentId || undefined })
          }
        >
          {isPending ? 'جاري الحفظ...' : 'حفظ الحساب'}
        </Button>
      </div>
    </Card>
  );
}
