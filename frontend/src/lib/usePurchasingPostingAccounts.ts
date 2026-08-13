import { useEffect, useState } from 'react';

export interface PurchasingPostingAccounts {
  cashOrBankAccountId: string;
  apAccountId: string;
  vatInputAccountId: string;
  inventoryAccountId: string;
}

const emptyAccounts: PurchasingPostingAccounts = {
  cashOrBankAccountId: '',
  apAccountId: '',
  vatInputAccountId: '',
  inventoryAccountId: '',
};

// إعدادات الترحيل المحاسبي لفواتير الشراء تُحفظ محلياً لكل شركة (مؤقتاً، لحين بناء شاشة إعدادات الشركة في الباك اند)
export function usePurchasingPostingAccounts(companyId: string | undefined) {
  const storageKey = `purchasing-posting-accounts-${companyId}`;
  const [accounts, setAccounts] = useState<PurchasingPostingAccounts>(emptyAccounts);

  useEffect(() => {
    if (!companyId) return;
    const saved = localStorage.getItem(storageKey);
    setAccounts(saved ? JSON.parse(saved) : emptyAccounts);
  }, [companyId, storageKey]);

  function save(next: PurchasingPostingAccounts) {
    setAccounts(next);
    if (companyId) localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const isComplete = Object.values(accounts).every((v) => v);

  return { accounts, save, isComplete };
}
