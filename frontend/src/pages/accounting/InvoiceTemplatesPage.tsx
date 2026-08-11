import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useCompany } from '../../context/CompanyContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';

interface MandatoryField {
  fieldKey: string;
  labelAr: string;
  zatcaRequired: boolean;
  warningMessage: string;
}

interface TemplateField {
  fieldKey: string;
  fieldLabel: string;
  isVisible: boolean;
  displayOrder: number;
  isCustomField: boolean;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  fields: TemplateField[];
}

let tempIdCounter = 0;

export function InvoiceTemplatesPage() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['invoice-templates', company?.id],
    queryFn: async () => {
      const res = await api.get<InvoiceTemplate[]>('/accounting/invoice-templates', {
        params: { companyId: company!.id },
      });
      return res.data;
    },
    enabled: !!company,
  });

  const { data: mandatoryCatalog } = useQuery({
    queryKey: ['mandatory-catalog'],
    queryFn: async () => {
      const res = await api.get<MandatoryField[]>('/accounting/invoice-templates/mandatory-catalog');
      return res.data;
    },
  });

  if (!company) {
    return <p className="text-gray-500">اختر شركة أولاً من الأعلى.</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">قوالب الفواتير — {company.name}</h2>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'إلغاء' : '+ قالب جديد'}</Button>
      </div>

      {showForm && mandatoryCatalog && (
        <TemplateForm
          companyId={company.id}
          mandatoryCatalog={mandatoryCatalog}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoice-templates', company.id] });
            setShowForm(false);
          }}
        />
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-gray-500 text-sm">جاري التحميل...</p>
        ) : !templates || templates.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-sm">لا توجد قوالب فواتير بعد.</p>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{t.name}</span>
                  {t.isDefault && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      افتراضي
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{t.fields.length} حقل</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[...t.fields]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((f) => (
                    <span
                      key={f.fieldKey}
                      className={`text-xs px-2 py-1 rounded-full ${
                        f.isVisible
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-50 text-gray-400 line-through'
                      }`}
                    >
                      {f.fieldLabel}
                    </span>
                  ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function TemplateForm({
  companyId,
  mandatoryCatalog,
  onSuccess,
}: {
  companyId: string;
  mandatoryCatalog: MandatoryField[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  // نبدأ القالب بكل الحقول الإلزامية ظاهرة افتراضياً، والمستخدم يقرر ما يفعله بعد ذلك
  const [fields, setFields] = useState<(TemplateField & { tempId: number })[]>(() =>
    mandatoryCatalog.map((m, index) => ({
      tempId: tempIdCounter++,
      fieldKey: m.fieldKey,
      fieldLabel: m.labelAr,
      isVisible: true,
      displayOrder: index,
      isCustomField: false,
    })),
  );
  const [customFieldLabel, setCustomFieldLabel] = useState('');

  const mandatoryMap = useMemo(
    () => new Map(mandatoryCatalog.map((m) => [m.fieldKey, m])),
    [mandatoryCatalog],
  );

  // الحقول الإلزامية التي أخفاها المستخدم حالياً - تُحسب فورياً في كل تغيير لعرض التنبيهات
  const hiddenMandatoryWarnings = fields.filter(
    (f) => !f.isVisible && mandatoryMap.has(f.fieldKey),
  );

  function toggleVisible(tempId: number) {
    setFields((prev) => prev.map((f) => (f.tempId === tempId ? { ...f, isVisible: !f.isVisible } : f)));
  }

  function moveField(tempId: number, direction: -1 | 1) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.tempId === tempId);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((f, i) => ({ ...f, displayOrder: i }));
    });
  }

  function removeCustomField(tempId: number) {
    setFields((prev) => prev.filter((f) => f.tempId !== tempId).map((f, i) => ({ ...f, displayOrder: i })));
  }

  function addCustomField() {
    if (!customFieldLabel.trim()) return;
    setFields((prev) => [
      ...prev,
      {
        tempId: tempIdCounter++,
        fieldKey: `custom_${Date.now()}`,
        fieldLabel: customFieldLabel.trim(),
        isVisible: true,
        displayOrder: prev.length,
        isCustomField: true,
      },
    ]);
    setCustomFieldLabel('');
  }

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/accounting/invoice-templates', {
        companyId,
        name,
        fields: fields.map(({ tempId, ...f }) => f),
      });
    },
    onSuccess,
  });

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">قالب فاتورة جديد</h3>
      <Field label="اسم القالب" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: قالب الفرع الرئيسي" />

      <div className="flex flex-col gap-1.5 mt-4">
        <span className="text-sm font-medium text-gray-700">الحقول</span>
        {fields.map((f, index) => {
          const isMandatory = mandatoryMap.has(f.fieldKey);
          return (
            <div
              key={f.tempId}
              className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2"
            >
              <div className="flex flex-col">
                <button
                  className="text-gray-400 text-xs disabled:opacity-20"
                  disabled={index === 0}
                  onClick={() => moveField(f.tempId, -1)}
                >
                  ▲
                </button>
                <button
                  className="text-gray-400 text-xs disabled:opacity-20"
                  disabled={index === fields.length - 1}
                  onClick={() => moveField(f.tempId, 1)}
                >
                  ▼
                </button>
              </div>
              <span className="flex-1 text-sm text-gray-800">{f.fieldLabel}</span>
              {isMandatory && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">إلزامي (ZATCA)</span>
              )}
              {f.isCustomField && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">مخصص</span>
              )}
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input type="checkbox" checked={f.isVisible} onChange={() => toggleVisible(f.tempId)} />
                ظاهر
              </label>
              {f.isCustomField && (
                <button
                  className="text-xs text-red-500"
                  onClick={() => removeCustomField(f.tempId)}
                >
                  حذف
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* شارة التنبيه: تظهر فوراً في الواجهة نفسها عند إخفاء أي حقل إلزامي، دون منع الحفظ */}
      {hiddenMandatoryWarnings.length > 0 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex flex-col gap-1">
          {hiddenMandatoryWarnings.map((f) => (
            <p key={f.fieldKey} className="text-xs text-yellow-800">
              ⚠️ {mandatoryMap.get(f.fieldKey)?.warningMessage}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 mt-4 pt-4 border-t border-gray-100">
        <Field
          label="إضافة حقل مخصص"
          value={customFieldLabel}
          onChange={(e) => setCustomFieldLabel(e.target.value)}
          placeholder="مثال: اسم المندوب"
          className="flex-1"
        />
        <Button variant="secondary" onClick={addCustomField} disabled={!customFieldLabel.trim()}>
          إضافة
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600 mt-3">{extractErrorMessage(mutation.error)}</p>
      )}

      <div className="mt-4">
        <Button disabled={!name || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'جاري الحفظ...' : 'حفظ القالب'}
        </Button>
      </div>
    </Card>
  );
}
