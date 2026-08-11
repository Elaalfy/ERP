import { useEffect, useState } from 'react';

export interface PostingAccounts {
  cashOrBankAccountId: string;
  revenueAccountId: string;
  vatPayableAccountId: string;
  arAccountId: string;
  cogsAccountId: string;
  inventoryAccountId: string;
}

const emptyAccounts: PostingAccounts = {
  cashOrBankAccountId: '',
  revenueAccountId: '',
  vatPayableAccountId: '',
  arAccountId: '',
  cogsAccountId: '',
  inventoryAccountId: '',
};

// إعدادات الترحيل المحاسبي لنقطة البيع تُحفظ محلياً لكل شركة (مؤقتاً، لحين بناء شاشة إعدادات الشركة في الباك اند)
export function usePostingAccounts(companyId: string | undefined) {
  const storageKey = `posting-accounts-${companyId}`;
  const [accounts, setAccounts] = useState<PostingAccounts>(emptyAccounts);

  useEffect(() => {
    if (!companyId) return;
    const saved = localStorage.getItem(storageKey);
    setAccounts(saved ? JSON.parse(saved) : emptyAccounts);
  }, [companyId, storageKey]);

  function save(next: PostingAccounts) {
    setAccounts(next);
    if (companyId) localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const isComplete = Object.values(accounts).every((v) => v);

  return { accounts, save, isComplete };
}
