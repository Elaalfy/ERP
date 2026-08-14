import { useEffect, useState } from 'react';

export interface HrPostingAccounts {
  salaryExpenseAccountId: string;
  gosiPayableAccountId: string;
  salariesPayableAccountId: string;
  employeeAdvancesAccountId: string;
  cashOrBankAccountId: string;
}

const emptyAccounts: HrPostingAccounts = {
  salaryExpenseAccountId: '',
  gosiPayableAccountId: '',
  salariesPayableAccountId: '',
  employeeAdvancesAccountId: '',
  cashOrBankAccountId: '',
};

// إعدادات الترحيل المحاسبي للرواتب والسلف تُحفظ محلياً لكل شركة (مؤقتاً، لحين بناء شاشة إعدادات الشركة في الباك اند)
export function useHrPostingAccounts(companyId: string | undefined) {
  const storageKey = `hr-posting-accounts-${companyId}`;
  const [accounts, setAccounts] = useState<HrPostingAccounts>(emptyAccounts);

  useEffect(() => {
    if (!companyId) return;
    const saved = localStorage.getItem(storageKey);
    setAccounts(saved ? JSON.parse(saved) : emptyAccounts);
  }, [companyId, storageKey]);

  function save(next: HrPostingAccounts) {
    setAccounts(next);
    if (companyId) localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const isComplete = Object.values(accounts).every((v) => v);

  return { accounts, save, isComplete };
}
