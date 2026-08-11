import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JournalEntry } from '../entities/journal-entry.entity';
import { CreateJournalEntryDto } from '../dto/journal-entry.dto';

@Injectable()
export class JournalEntriesService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly journalRepo: Repository<JournalEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateJournalEntryDto) {
    // القاعدة الذهبية: مجموع المدين يجب أن يساوي مجموع الدائن قبل أي حفظ فعلي
    const totalDebit = dto.lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + Number(l.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `القيد غير متوازن: مجموع المدين (${totalDebit}) لا يساوي مجموع الدائن (${totalCredit})`,
      );
    }

    if (totalDebit === 0) {
      throw new BadRequestException('لا يمكن حفظ قيد بقيمة صفرية');
    }

    return this.dataSource.transaction(async (manager) => {
      const entryNumber = await this.generateEntryNumber(manager, dto.companyId);

      const entry = manager.create(JournalEntry, {
        companyId: dto.companyId,
        periodId: dto.periodId,
        entryNumber,
        entryDate: dto.entryDate,
        sourceType: dto.sourceType as any,
        sourceRefId: dto.sourceRefId,
        description: dto.description,
        createdById: dto.createdById,
        isManual: dto.sourceType === 'manual',
        status: 'posted',
        lines: dto.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          lineNote: l.lineNote,
        })) as any,
      });

      return manager.save(entry);
    });
  }

  private async generateEntryNumber(manager: any, companyId: string): Promise<string> {
    const count = await manager.count(JournalEntry, { where: { companyId } });
    const next = count + 1;
    return `JE-${String(next).padStart(6, '0')}`;
  }

  findAllForCompany(companyId: string) {
    return this.journalRepo.find({
      where: { companyId },
      relations: { lines: true },
      order: { entryDate: 'DESC' },
    });
  }
}
