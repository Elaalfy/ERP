import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EmployeeAdvanceLedgerEntry } from '../entities/employee-advance-ledger-entry.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { GrantAdvanceDto } from '../dto/hr.dto';

@Injectable()
export class EmployeeAdvancesService {
  constructor(
    @InjectRepository(EmployeeAdvanceLedgerEntry)
    private readonly ledgerRepo: Repository<EmployeeAdvanceLedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async getBalance(employeeId: string): Promise<number> {
    const result = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.employeeId = :employeeId', { employeeId })
      .getRawOne();
    return Number(result.total);
  }

  getLedger(employeeId: string) {
    return this.ledgerRepo.find({ where: { employeeId }, order: { createdAt: 'DESC' } });
  }

  // صرف سلفة جديدة لموظف: قيد محاسبي مدين ذمم سلف الموظفين / دائن النقدية أو البنك
  // + إضافة حركة موجبة في سجل السلف (ذمة على الموظف)
  async grant(employeeId: string, dto: GrantAdvanceDto) {
    return this.dataSource.transaction(async (manager) => {
      const entryNumber = await this.generateEntryNumber(manager, dto.companyId);

      const journalEntry = manager.create(JournalEntry, {
        companyId: dto.companyId,
        periodId: dto.periodId,
        entryNumber,
        entryDate: new Date().toISOString().slice(0, 10),
        sourceType: 'manual',
        description: dto.note || 'قيد آلي لصرف سلفة لموظف',
        createdById: dto.createdById,
        isManual: false,
        status: 'posted',
        lines: [
          { accountId: dto.employeeAdvancesAccountId, debit: dto.amount, credit: 0 },
          { accountId: dto.cashOrBankAccountId, debit: 0, credit: dto.amount },
        ] as any,
      });
      const savedJournalEntry = await manager.save(journalEntry);

      const ledgerEntry = manager.create(EmployeeAdvanceLedgerEntry, {
        employeeId,
        type: 'advance',
        amount: dto.amount,
        referenceId: savedJournalEntry.id,
        note: dto.note || 'صرف سلفة',
      });
      const savedLedgerEntry = await manager.save(ledgerEntry);

      const balance = await manager
        .createQueryBuilder(EmployeeAdvanceLedgerEntry, 'l')
        .select('COALESCE(SUM(l.amount), 0)', 'total')
        .where('l.employeeId = :employeeId', { employeeId })
        .getRawOne();

      return { ledgerEntry: savedLedgerEntry, journalEntryId: savedJournalEntry.id, newBalance: Number(balance.total) };
    });
  }

  private async generateEntryNumber(manager: DataSource['manager'], companyId: string): Promise<string> {
    const count = await manager.count(JournalEntry, { where: { companyId } });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }
}
