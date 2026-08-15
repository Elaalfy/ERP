import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import { Company } from '../../core/entities/company.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  // فحص إلزامي: فقط مستخدم بدور group_manager يستطيع الوصول لأي تقرير موحد
  private async assertGroupManager(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    if (user.role !== 'group_manager') {
      throw new ForbiddenException('هذا التقرير مقصور على صلاحية مدير المجموعة فقط');
    }
    return user;
  }

  // ملخص موحد لكل شركات المجموعة: مبيعات، مشتريات، ذمم عملاء، ذمم موردين، قيمة المخزون، رواتب، لكل شركة + الإجمالي
  // month/year اختياريان: إن مُرِّرا، تُقيَّد المبيعات والمشتريات والرواتب بذلك الشهر فقط
  async getGroupSummary(userId: string, month?: number, year?: number) {
    await this.assertGroupManager(userId);

    const companies = await this.companyRepo.find({ where: { isActive: true } });
    const hasMonthFilter = !!month && !!year;

    const perCompany = await Promise.all(
      companies.map(async (company) => {
        const salesResult = await this.dataSource.query(
          hasMonthFilter
            ? `SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices
               WHERE company_id = $1 AND EXTRACT(MONTH FROM invoice_date) = $2 AND EXTRACT(YEAR FROM invoice_date) = $3`
            : `SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE company_id = $1`,
          hasMonthFilter ? [company.id, month, year] : [company.id],
        );
        const purchasesResult = await this.dataSource.query(
          hasMonthFilter
            ? `SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_invoices
               WHERE company_id = $1 AND EXTRACT(MONTH FROM invoice_date) = $2 AND EXTRACT(YEAR FROM invoice_date) = $3`
            : `SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_invoices WHERE company_id = $1`,
          hasMonthFilter ? [company.id, month, year] : [company.id],
        );
        // إجمالي تكلفة البضاعة المباعة (لحساب الربح التقريبي) لنفس نطاق المبيعات أعلاه
        const cogsResult = await this.dataSource.query(
          hasMonthFilter
            ? `SELECT COALESCE(SUM(total_cost), 0) as total FROM invoices
               WHERE company_id = $1 AND EXTRACT(MONTH FROM invoice_date) = $2 AND EXTRACT(YEAR FROM invoice_date) = $3`
            : `SELECT COALESCE(SUM(total_cost), 0) as total FROM invoices WHERE company_id = $1`,
          hasMonthFilter ? [company.id, month, year] : [company.id],
        );
        // ذمم العملاء والموردين والمخزون: أرصدة حالية (لحظية) دائماً، لا تُقيَّد بالشهر المختار
        const arResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(l.amount), 0) as total
           FROM customer_ledger l
           JOIN customers c ON c.id = l.customer_id
           WHERE c.company_id = $1`,
          [company.id],
        );
        const apResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(l.amount), 0) as total
           FROM supplier_ledger l
           JOIN suppliers s ON s.id = l.supplier_id
           WHERE s.company_id = $1`,
          [company.id],
        );
        const inventoryValueResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(quantity_remaining * unit_cost), 0) as total
           FROM stock_batches WHERE company_id = $1`,
          [company.id],
        );
        // إجمالي صافي الرواتب المصروفة (دورات معتمدة فقط) لنفس الشهر إن حُدِّد، وإلا كل الدورات
        const payrollResult = await this.dataSource.query(
          hasMonthFilter
            ? `SELECT COALESCE(SUM(total_net_pay), 0) as total FROM payroll_runs
               WHERE company_id = $1 AND status = 'posted' AND period_month = $2 AND period_year = $3`
            : `SELECT COALESCE(SUM(total_net_pay), 0) as total FROM payroll_runs WHERE company_id = $1 AND status = 'posted'`,
          hasMonthFilter ? [company.id, month, year] : [company.id],
        );
        // إجمالي رصيد سلف الموظفين القائم حالياً (لحظي دائماً)
        const advancesResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(l.amount), 0) as total
           FROM employee_advance_ledger l
           JOIN employees e ON e.id = l.employee_id
           WHERE e.company_id = $1`,
          [company.id],
        );

        return {
          companyId: company.id,
          companyName: company.name,
          totalSales: Number(salesResult[0].total),
          totalPurchases: Number(purchasesResult[0].total),
          grossProfit: Number(salesResult[0].total) - Number(cogsResult[0].total),
          accountsReceivable: Number(arResult[0].total),
          accountsPayable: Number(apResult[0].total),
          inventoryValue: Number(inventoryValueResult[0].total),
          payrollExpense: Number(payrollResult[0].total),
          employeeAdvancesBalance: Number(advancesResult[0].total),
        };
      }),
    );

    const totals = perCompany.reduce(
      (acc, c) => ({
        totalSales: acc.totalSales + c.totalSales,
        totalPurchases: acc.totalPurchases + c.totalPurchases,
        grossProfit: acc.grossProfit + c.grossProfit,
        accountsReceivable: acc.accountsReceivable + c.accountsReceivable,
        accountsPayable: acc.accountsPayable + c.accountsPayable,
        inventoryValue: acc.inventoryValue + c.inventoryValue,
        payrollExpense: acc.payrollExpense + c.payrollExpense,
        employeeAdvancesBalance: acc.employeeAdvancesBalance + c.employeeAdvancesBalance,
      }),
      {
        totalSales: 0,
        totalPurchases: 0,
        grossProfit: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        inventoryValue: 0,
        payrollExpense: 0,
        employeeAdvancesBalance: 0,
      },
    );

    return { companies: perCompany, groupTotals: totals, filter: hasMonthFilter ? { month, year } : null };
  }

  // تقرير أعمار الذمم (Aging) — يُستخدم لكل من العملاء (ذمم مدينة) والموردين (ذمم دائنة)
  // يُخصِّص كل حركة سداد/تحصيل لأقدم فاتورة غير مسددة أولاً (FIFO)، ثم يُصنِّف المتبقي حسب عمر الفاتورة
  private buildAgingBuckets(entries: { amount: number; createdAt: Date }[]) {
    const invoiceQueue: { remaining: number; createdAt: Date }[] = [];

    for (const entry of entries) {
      let amount = Number(entry.amount);
      if (amount > 0) {
        invoiceQueue.push({ remaining: amount, createdAt: entry.createdAt });
      } else if (amount < 0) {
        let reduction = Math.abs(amount);
        for (const inv of invoiceQueue) {
          if (reduction <= 0) break;
          if (inv.remaining <= 0) continue;
          const applied = Math.min(inv.remaining, reduction);
          inv.remaining -= applied;
          reduction -= applied;
        }
      }
    }

    const now = new Date();
    const buckets = { current: 0, days30to60: 0, over60: 0 };
    let total = 0;
    for (const inv of invoiceQueue) {
      if (inv.remaining <= 0) continue;
      const ageDays = Math.floor((now.getTime() - new Date(inv.createdAt).getTime()) / 86400000);
      if (ageDays <= 30) buckets.current += inv.remaining;
      else if (ageDays <= 60) buckets.days30to60 += inv.remaining;
      else buckets.over60 += inv.remaining;
      total += inv.remaining;
    }
    return { total, buckets };
  }

  // ذمم العملاء المدينة، مصنّفة بفئات عمرية (0-30 / 30-60 / أكثر من 60 يوماً)
  async getReceivablesAging(userId: string) {
    await this.assertGroupManager(userId);

    const customers = await this.dataSource.query(`
      SELECT c.id as "customerId", c.name as "customerName", c.company_id as "companyId", co.name as "companyName"
      FROM customers c
      JOIN companies co ON co.id = c.company_id
    `);

    const results: any[] = [];
    for (const cust of customers) {
      const entries = await this.dataSource.query(
        `SELECT amount, created_at as "createdAt" FROM customer_ledger WHERE customer_id = $1 ORDER BY created_at ASC`,
        [cust.customerId],
      );
      const aging = this.buildAgingBuckets(entries);
      if (aging.total !== 0) {
        results.push({ ...cust, balance: aging.total, buckets: aging.buckets });
      }
    }
    return results.sort((a, b) => b.balance - a.balance);
  }

  // ذمم الموردين الدائنة، مصنّفة بنفس فئات العمر
  async getPayablesAging(userId: string) {
    await this.assertGroupManager(userId);

    const suppliers = await this.dataSource.query(`
      SELECT s.id as "supplierId", s.name as "supplierName", s.company_id as "companyId", co.name as "companyName"
      FROM suppliers s
      JOIN companies co ON co.id = s.company_id
    `);

    const results: any[] = [];
    for (const sup of suppliers) {
      const entries = await this.dataSource.query(
        `SELECT amount, created_at as "createdAt" FROM supplier_ledger WHERE supplier_id = $1 ORDER BY created_at ASC`,
        [sup.supplierId],
      );
      const aging = this.buildAgingBuckets(entries);
      if (aging.total !== 0) {
        results.push({ ...sup, balance: aging.total, buckets: aging.buckets });
      }
    }
    return results.sort((a, b) => b.balance - a.balance);
  }
}
