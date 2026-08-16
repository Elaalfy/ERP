import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Company } from '../modules/core/entities/company.entity';
import { User } from '../modules/core/entities/user.entity';
import { UserCompanyRole } from '../modules/core/entities/user-company-role.entity';
import { CoaTemplate } from '../modules/accounting/entities/coa-template.entity';
import { CoaTemplateAccount } from '../modules/accounting/entities/coa-template-account.entity';
import { Account } from '../modules/accounting/entities/account.entity';
import { FiscalPeriod } from '../modules/accounting/entities/fiscal-period.entity';
import { JournalEntry } from '../modules/accounting/entities/journal-entry.entity';
import { JournalEntryLine } from '../modules/accounting/entities/journal-entry-line.entity';
import { MandatoryFieldCatalog } from '../modules/accounting/entities/mandatory-field-catalog.entity';
import { InvoiceTemplate } from '../modules/accounting/entities/invoice-template.entity';
import { InvoiceTemplateField } from '../modules/accounting/entities/invoice-template-field.entity';
import { Product } from '../modules/inventory/entities/product.entity';
import { StockBatch } from '../modules/inventory/entities/stock-batch.entity';
import { Customer } from '../modules/sales/entities/customer.entity';
import { Invoice } from '../modules/sales/entities/invoice.entity';
import { InvoiceLine } from '../modules/sales/entities/invoice-line.entity';
import { CustomerLedgerEntry } from '../modules/sales/entities/customer-ledger-entry.entity';
import { CashierShift } from '../modules/sales/entities/cashier-shift.entity';
import { Supplier } from '../modules/purchasing/entities/supplier.entity';
import { PurchaseInvoice } from '../modules/purchasing/entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from '../modules/purchasing/entities/purchase-invoice-line.entity';
import { SupplierLedgerEntry } from '../modules/purchasing/entities/supplier-ledger-entry.entity';
import { Employee } from '../modules/hr/entities/employee.entity';
import { PayrollRun } from '../modules/hr/entities/payroll-run.entity';
import { Payslip } from '../modules/hr/entities/payslip.entity';
import { EmployeeAdvanceLedgerEntry } from '../modules/hr/entities/employee-advance-ledger-entry.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASS || 'erp_pass',
  database: process.env.DB_NAME || 'erp_db',
  entities: [
    Company,
    User,
    UserCompanyRole,
    CoaTemplate,
    CoaTemplateAccount,
    Account,
    FiscalPeriod,
    JournalEntry,
    JournalEntryLine,
    MandatoryFieldCatalog,
    InvoiceTemplate,
    InvoiceTemplateField,
    Product,
    StockBatch,
    Customer,
    Invoice,
    InvoiceLine,
    CustomerLedgerEntry,
    CashierShift,
    Supplier,
    PurchaseInvoice,
    PurchaseInvoiceLine,
    SupplierLedgerEntry,
    Employee,
    PayrollRun,
    Payslip,
    EmployeeAdvanceLedgerEntry,
  ],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
};

export default registerAs('typeorm', () => dataSourceOptions);
export const AppDataSource = new DataSource(dataSourceOptions);
