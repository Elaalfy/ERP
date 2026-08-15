import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AccountsPage } from './pages/accounting/AccountsPage';
import { JournalEntriesPage } from './pages/accounting/JournalEntriesPage';
import { InvoiceTemplatesPage } from './pages/accounting/InvoiceTemplatesPage';
import { FiscalPeriodsPage } from './pages/accounting/FiscalPeriodsPage';
import { POSPage } from './pages/sales/POSPage';
import { SuppliersPage } from './pages/purchasing/SuppliersPage';
import { PurchaseInvoicePage } from './pages/purchasing/PurchaseInvoicePage';
import { EmployeesPage } from './pages/hr/EmployeesPage';
import { PayrollPage } from './pages/hr/PayrollPage';
import { GroupReportsPage } from './pages/reports/GroupReportsPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/accounting/accounts" replace />} />
        <Route path="/accounting/accounts" element={<AccountsPage />} />
        <Route path="/accounting/journal-entries" element={<JournalEntriesPage />} />
        <Route path="/accounting/invoice-templates" element={<InvoiceTemplatesPage />} />
        <Route path="/accounting/fiscal-periods" element={<FiscalPeriodsPage />} />
        <Route path="/sales/pos" element={<POSPage />} />
        <Route path="/purchasing/suppliers" element={<SuppliersPage />} />
        <Route path="/purchasing/invoices" element={<PurchaseInvoicePage />} />
        <Route path="/hr/employees" element={<EmployeesPage />} />
        <Route path="/hr/payroll" element={<PayrollPage />} />
        <Route path="/reports/group" element={<GroupReportsPage />} />
      </Routes>
    </AppLayout>
  );
}
