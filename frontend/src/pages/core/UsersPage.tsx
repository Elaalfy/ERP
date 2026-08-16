import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';

type Role = 'accountant' | 'cashier' | 'employee';

interface CompanyRoleEntry {
  companyId: string;
  companyName?: string;
  role: Role;
}

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isGroupManager: boolean;
  companyRoles: CompanyRoleEntry[];
}

interface CompanyOption {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<Role, string> = {
  accountant: 'محاسب',
  cashier: 'كاشير',
  employee: 'موظف',
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<UserRow[]>('/users');
      return res.data;
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/users/${id}/deactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  if (!currentUser?.isGroupManager) {
    return (
      <Card>
        <p className="text-sm text-red-600">هذه الشاشة مقصورة على مدير المجموعة فقط.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">إدارة المستخدمين</h1>
        <Button onClick={() => setShowAddModal(true)}>+ مستخدم جديد</Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="text-sm text-gray-500">جارٍ التحميل...</p>
        ) : (
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 font-medium">الاسم</th>
                <th className="py-2 font-medium">البريد الإلكتروني</th>
                <th className="py-2 font-medium">الصلاحيات</th>
                <th className="py-2 font-medium">الحالة</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="py-2">{u.fullName}</td>
                  <td className="py-2 text-gray-600">{u.email}</td>
                  <td className="py-2">
                    {u.isGroupManager ? (
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                        مدير مجموعة
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.companyRoles.map((cr) => (
                          <span
                            key={cr.companyId}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                          >
                            {cr.companyName}: {ROLE_LABELS[cr.role]}
                          </span>
                        ))}
                        {u.companyRoles.length === 0 && <span className="text-gray-400 text-xs">لا توجد صلاحيات</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2">
                    {u.isActive ? (
                      <span className="text-green-700 text-xs">نشط</span>
                    ) : (
                      <span className="text-gray-400 text-xs">معطّل</span>
                    )}
                  </td>
                  <td className="py-2 text-left">
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => setEditingUser(u)}>
                        تعديل
                      </Button>
                      {u.isActive && u.id !== currentUser.id && (
                        <Button variant="danger" onClick={() => deactivateMutation.mutate(u.id)}>
                          تعطيل
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showAddModal && <UserFormModal onClose={() => setShowAddModal(false)} />}
      {editingUser && <UserFormModal existingUser={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

function UserFormModal({ existingUser, onClose }: { existingUser?: UserRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!existingUser;

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get<CompanyOption[]>('/companies');
      return res.data;
    },
  });

  const [fullName, setFullName] = useState(existingUser?.fullName ?? '');
  const [email, setEmail] = useState(existingUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [isGroupManager, setIsGroupManager] = useState(existingUser?.isGroupManager ?? false);
  const [companyRoles, setCompanyRoles] = useState<CompanyRoleEntry[]>(existingUser?.companyRoles ?? []);
  const [error, setError] = useState<string | null>(null);

  const toggleCompanyRole = (companyId: string) => {
    setCompanyRoles((prev) => {
      const exists = prev.find((cr) => cr.companyId === companyId);
      if (exists) return prev.filter((cr) => cr.companyId !== companyId);
      return [...prev, { companyId, role: 'employee' }];
    });
  };

  const setRoleFor = (companyId: string, role: Role) => {
    setCompanyRoles((prev) => prev.map((cr) => (cr.companyId === companyId ? { ...cr, role } : cr)));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return api.patch(`/users/${existingUser!.id}`, {
          fullName,
          isGroupManager,
          companyRoles,
          ...(password ? { newPassword: password } : {}),
        });
      }
      return api.post('/users', { fullName, email, password, isGroupManager, companyRoles });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  return (
    <Modal title={isEdit ? 'تعديل مستخدم' : 'مستخدم جديد'} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <Field label="الاسم الكامل" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Field
          label="البريد الإلكتروني"
          type="email"
          required
          disabled={isEdit}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={isEdit ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}
          type="password"
          required={!isEdit}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isGroupManager} onChange={(e) => setIsGroupManager(e.target.checked)} />
          مدير مجموعة (صلاحية كاملة على كل الشركات)
        </label>

        {!isGroupManager && (
          <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">صلاحيات الشركات</span>
            {companies?.map((c) => {
              const entry = companyRoles.find((cr) => cr.companyId === c.id);
              return (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!entry} onChange={() => toggleCompanyRole(c.id)} />
                  <span className="flex-1">{c.name}</span>
                  {entry && (
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                      value={entry.role}
                      onChange={(e) => setRoleFor(c.id, e.target.value as Role)}
                    >
                      <option value="accountant">محاسب</option>
                      <option value="cashier">كاشير</option>
                      <option value="employee">موظف</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
