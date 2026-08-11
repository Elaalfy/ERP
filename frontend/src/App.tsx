import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AccountsPage } from './pages/accounting/AccountsPage';
import { JournalEntriesPage } from './pages/accounting/JournalEntriesPage';
import { InvoiceTemplatesPage } from './pages/accounting/InvoiceTemplatesPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/accounting/accounts" replace />} />
        <Route path="/accounting/accounts" element={<AccountsPage />} />
        <Route path="/accounting/journal-entries" element={<JournalEntriesPage />} />
        <Route path="/accounting/invoice-templates" element={<InvoiceTemplatesPage />} />
      </Routes>
    </AppLayout>
  );
}
