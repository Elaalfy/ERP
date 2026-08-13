import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { SupplierLedgerEntry } from '../entities/supplier-ledger-entry.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { PaySupplierDto } from '../dto/purchase-invoice.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierLedgerEntry)
    private readonly ledgerRepo: Repository<SupplierLedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: Partial<Supplier>) {
    const supplier = this.supplierRepo.create(dto);
    return this.supplierRepo.save(supplier);
  }

  findAllForCompany(companyId: string) {
    return this.supplierRepo.find({ where: { companyId } });
  }

  async getBalance(supplierId: string): Promise<number> {
    const result = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.supplierId = :supplierId', { supplierId })
      .getRawOne();
    return Number(result.total);
  }

  getLedger(supplierId: string) {
    return this.ledgerRepo.find({ where: { supplierId }, order: { createdAt: 'DESC' } });
  }

  // تسديد دفعة (كاملة أو جزئية) لمورد: قيد محاسبي مدين ذمم الموردين / دائن النقدية أو البنك
  // + تخفيض رصيد المورد الدائن في السجل (قيمة سالبة)
  async payInvoice(supplierId: string, dto: PaySupplierDto) {
    return this.dataSource.transaction(async (manager) => {
      const entryNumber = await this.generateEntryNumber(manager, dto.companyId);

      const journalEntry = manager.create(JournalEntry, {
        companyId: dto.companyId,
        periodId: dto.periodId,
        entryNumber,
        entryDate: new Date().toISOString().slice(0, 10),
        sourceType: 'purchase',
        description: dto.note || 'قيد آلي لسداد دفعة لمورد',
        createdById: dto.createdById,
        isManual: false,
        status: 'posted',
        lines: [
          { accountId: dto.apAccountId, debit: dto.amount, credit: 0 },
          { accountId: dto.cashOrBankAccountId, debit: 0, credit: dto.amount },
        ] as any,
      });
      const savedJournalEntry = await manager.save(journalEntry);

      const ledgerEntry = manager.create(SupplierLedgerEntry, {
        supplierId,
        type: 'payment',
        amount: -dto.amount,
        referenceId: savedJournalEntry.id,
        note: dto.note || 'سداد دفعة للمورد',
      });
      const savedLedgerEntry = await manager.save(ledgerEntry);

      const balance = await manager
        .createQueryBuilder(SupplierLedgerEntry, 'l')
        .select('COALESCE(SUM(l.amount), 0)', 'total')
        .where('l.supplierId = :supplierId', { supplierId })
        .getRawOne();

      return { ledgerEntry: savedLedgerEntry, journalEntryId: savedJournalEntry.id, newBalance: Number(balance.total) };
    });
  }

  private async generateEntryNumber(manager: DataSource['manager'], companyId: string): Promise<string> {
    const count = await manager.count(JournalEntry, { where: { companyId } });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }
}
