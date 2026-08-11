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

  // ملخص موحد لكل شركات المجموعة: مبيعات، مشتريات، ذمم عملاء، ذمم موردين، قيمة المخزون، لكل شركة + الإجمالي
  async getGroupSummary(userId: string) {
    await this.assertGroupManager(userId);

    const companies = await this.companyRepo.find({ where: { isActive: true } });

    const perCompany = await Promise.all(
      companies.map(async (company) => {
        const salesResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE company_id = $1`,
          [company.id],
        );
        const purchasesResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_invoices WHERE company_id = $1`,
          [company.id],
        );
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
        // قيمة المخزون الحالية = مجموع (الكمية المتبقية × تكلفة الوحدة) لكل الدفعات النشطة
        const inventoryValueResult = await this.dataSource.query(
          `SELECT COALESCE(SUM(quantity_remaining * unit_cost), 0) as total
           FROM stock_batches WHERE company_id = $1`,
          [company.id],
        );

        return {
          companyId: company.id,
          companyName: company.name,
          totalSales: Number(salesResult[0].total),
          totalPurchases: Number(purchasesResult[0].total),
          accountsReceivable: Number(arResult[0].total),
          accountsPayable: Number(apResult[0].total),
          inventoryValue: Number(inventoryValueResult[0].total),
        };
      }),
    );

    const totals = perCompany.reduce(
      (acc, c) => ({
        totalSales: acc.totalSales + c.totalSales,
        totalPurchases: acc.totalPurchases + c.totalPurchases,
        accountsReceivable: acc.accountsReceivable + c.accountsReceivable,
        accountsPayable: acc.accountsPayable + c.accountsPayable,
        inventoryValue: acc.inventoryValue + c.inventoryValue,
      }),
      { totalSales: 0, totalPurchases: 0, accountsReceivable: 0, accountsPayable: 0, inventoryValue: 0 },
    );

    return { companies: perCompany, groupTotals: totals };
  }

  // تقرير أعمار الذمين (Aging) لعميل واحد أو كل عملاء المجموعة - مبسّط: يعرض إجمالي غير مصنف بعد (يُطوَّر لاحقاً بفواصل زمنية)
  async getReceivablesAging(userId: string) {
    await this.assertGroupManager(userId);

    const result = await this.dataSource.query(`
      SELECT c.id as "customerId", c.name as "customerName", c.company_id as "companyId",
             COALESCE(SUM(l.amount), 0) as balance
      FROM customers c
      LEFT JOIN customer_ledger l ON l.customer_id = c.id
      GROUP BY c.id, c.name, c.company_id
      HAVING COALESCE(SUM(l.amount), 0) != 0
      ORDER BY balance DESC
    `);

    return result.map((r: any) => ({ ...r, balance: Number(r.balance) }));
  }
}
