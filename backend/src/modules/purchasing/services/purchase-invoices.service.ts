import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from '../entities/purchase-invoice-line.entity';
import { SupplierLedgerEntry } from '../entities/supplier-ledger-entry.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { StockService } from '../../inventory/services/stock.service';
import { CreatePurchaseInvoiceDto } from '../dto/purchase-invoice.dto';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepo: Repository<PurchaseInvoice>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
  ) {}

  async create(dto: CreatePurchaseInvoiceDto) {
    return this.dataSource.transaction(async (manager) => {
      let subtotal = 0;
      const invoiceLines: Partial<PurchaseInvoiceLine>[] = [];

      // 1) لكل سطر: إنشاء دفعة مخزون فعلية بتكلفتها (أساس FIFO لاحقاً عند البيع)
      for (const line of dto.lines) {
        const lineTotal = line.quantity * line.unitCost;
        subtotal += lineTotal;

        const batch = await this.stockService.receiveStockInTransaction(manager, {
          companyId: dto.companyId,
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
        });

        invoiceLines.push({
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          lineTotal,
          stockBatchId: batch.id,
        });
      }

      const vatAmount = Math.round(subtotal * dto.vatRate * 100) / 100;
      const totalAmount = subtotal + vatAmount;

      // 2) القيد المحاسبي التلقائي: مدين المخزون + مدين ضريبة قابلة للخصم / دائن النقدية أو ذمم الموردين
      const entryNumber = await this.generateEntryNumber(manager, dto.companyId);
      const payableSideAccountId = dto.paymentMethod === 'credit' ? dto.apAccountId : dto.cashOrBankAccountId;

      const journalLines = [
        { accountId: dto.inventoryAccountId, debit: subtotal, credit: 0 },
      ];
      if (vatAmount > 0) {
        journalLines.push({ accountId: dto.vatInputAccountId, debit: vatAmount, credit: 0 });
      }
      journalLines.push({ accountId: payableSideAccountId, debit: 0, credit: totalAmount });

      const journalEntry = manager.create(JournalEntry, {
        companyId: dto.companyId,
        periodId: dto.periodId,
        entryNumber,
        entryDate: new Date().toISOString().slice(0, 10),
        sourceType: 'purchase',
        description: `قيد آلي لفاتورة شراء`,
        createdById: dto.createdById,
        isManual: false,
        status: 'posted',
        lines: journalLines as any,
      });
      const savedJournalEntry = await manager.save(journalEntry);

      // 3) إنشاء فاتورة الشراء نفسها
      const invoiceNumber = await this.generateInvoiceNumber(manager, dto.companyId);
      const invoice = manager.create(PurchaseInvoice, {
        companyId: dto.companyId,
        invoiceNumber,
        supplierInvoiceRef: dto.supplierInvoiceRef,
        invoiceDate: new Date(),
        supplierId: dto.supplierId,
        paymentMethod: dto.paymentMethod as any,
        subtotal,
        vatAmount,
        totalAmount,
        journalEntryId: savedJournalEntry.id,
        lines: invoiceLines as any,
      });
      const savedInvoice = await manager.save(invoice);

      // 4) إن كان الشراء آجلاً، تُسجَّل الحركة في سجل حساب المورد (دين على الشركة)
      if (dto.paymentMethod === 'credit') {
        const ledgerEntry = manager.create(SupplierLedgerEntry, {
          supplierId: dto.supplierId,
          type: 'invoice',
          amount: totalAmount,
          referenceId: savedInvoice.id,
          note: `فاتورة شراء رقم ${invoiceNumber}`,
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
    const count = await manager.count(PurchaseInvoice, { where: { companyId } });
    return `PINV-${String(count + 1).padStart(6, '0')}`;
  }

  findAllForCompany(companyId: string) {
    return this.purchaseInvoiceRepo.find({
      where: { companyId },
      relations: { lines: true },
      order: { invoiceDate: 'DESC' },
    });
  }
}
