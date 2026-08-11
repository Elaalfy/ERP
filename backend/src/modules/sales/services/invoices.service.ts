import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceLine } from '../entities/invoice-line.entity';
import { CustomerLedgerEntry } from '../entities/customer-ledger-entry.entity';
import { Product } from '../../inventory/entities/product.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { StockService } from '../../inventory/services/stock.service';
import { CreateInvoiceDto } from '../dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
  ) {}

  async create(dto: CreateInvoiceDto) {
    if (dto.paymentMethod === 'credit' && !dto.customerId) {
      throw new BadRequestException('البيع الآجل يتطلب تحديد عميل');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1) جلب أسعار المنتجات والتحقق من وجودها
      const productIds = dto.lines.map((l) => l.productId);
      const products = await manager.findBy(Product, { id: In(productIds) });
      if (products.length !== productIds.length) {
        throw new BadRequestException('أحد المنتجات في الفاتورة غير موجود');
      }

      // 2) خصم المخزون بـ FIFO لكل سطر، وحساب التكلفة الفعلية
      let subtotal = 0;
      let totalCost = 0;
      const invoiceLines: Partial<InvoiceLine>[] = [];

      for (const line of dto.lines) {
        const fifoResult = await this.stockService.consumeFifo(manager, line.productId, line.quantity);
        const lineTotal = line.quantity * line.unitPrice;

        subtotal += lineTotal;
        totalCost += fifoResult.totalCost;

        invoiceLines.push({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          unitCost: fifoResult.averageUnitCost,
          lineTotal,
        });
      }

      const vatAmount = Math.round(subtotal * dto.vatRate * 100) / 100;
      const totalAmount = subtotal + vatAmount;

      // 3) إنشاء القيد المحاسبي التلقائي (قيدان مركّبان: قيد الإيراد + قيد تكلفة البضاعة المباعة)
      const entryNumber = await this.generateEntryNumber(manager, dto.companyId);
      const revenueSideAccountId = dto.paymentMethod === 'credit' ? dto.arAccountId : dto.cashOrBankAccountId;

      const journalLines = [
        { accountId: revenueSideAccountId, debit: totalAmount, credit: 0 },
        { accountId: dto.revenueAccountId, debit: 0, credit: subtotal },
      ];
      if (vatAmount > 0) {
        journalLines.push({ accountId: dto.vatPayableAccountId, debit: 0, credit: vatAmount });
      }
      // قيد تكلفة البضاعة المباعة: مدين COGS / دائن المخزون
      journalLines.push({ accountId: dto.cogsAccountId, debit: totalCost, credit: 0 });
      journalLines.push({ accountId: dto.inventoryAccountId, debit: 0, credit: totalCost });

      const journalEntry = manager.create(JournalEntry, {
        companyId: dto.companyId,
        periodId: dto.periodId,
        entryNumber,
        entryDate: new Date().toISOString().slice(0, 10),
        sourceType: 'sale',
        description: `قيد آلي لفاتورة بيع`,
        createdById: dto.createdById,
        isManual: false,
        status: 'posted',
        lines: journalLines as any,
      });
      const savedJournalEntry = await manager.save(journalEntry);

      // 4) إنشاء الفاتورة نفسها مرتبطة بالقيد
      const invoiceNumber = await this.generateInvoiceNumber(manager, dto.companyId);
      const invoice = manager.create(Invoice, {
        companyId: dto.companyId,
        invoiceNumber,
        invoiceDate: new Date(),
        customerId: dto.customerId,
        templateId: dto.templateId,
        shiftId: dto.shiftId,
        paymentMethod: dto.paymentMethod as any,
        subtotal,
        vatAmount,
        totalAmount,
        totalCost,
        journalEntryId: savedJournalEntry.id,
        status: 'posted',
        lines: invoiceLines as any,
      });
      const savedInvoice = await manager.save(invoice);

      // 5) إن كان البيع آجلاً، تُسجَّل الحركة في سجل حساب العميل (دين عليه)
      if (dto.paymentMethod === 'credit') {
        const ledgerEntry = manager.create(CustomerLedgerEntry, {
          customerId: dto.customerId,
          type: 'invoice',
          amount: totalAmount,
          referenceId: savedInvoice.id,
          note: `فاتورة رقم ${invoiceNumber}`,
        });
        await manager.save(ledgerEntry);
      }

      return savedInvoice;
    });
  }

  private async generateEntryNumber(manager: EntityManager, companyId: string): Promise<string> {
    const count = await manager.count(JournalEntry, { where: { companyId } });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateInvoiceNumber(manager: EntityManager, companyId: string): Promise<string> {
    const count = await manager.count(Invoice, { where: { companyId } });
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  findAllForCompany(companyId: string) {
    return this.invoiceRepo.find({
      where: { companyId },
      relations: { lines: true },
      order: { invoiceDate: 'DESC' },
    });
  }

  findOne(id: string) {
    return this.invoiceRepo.findOne({ where: { id }, relations: { lines: true } });
  }
}
