import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalPeriod } from '../entities/fiscal-period.entity';
import { CreateFiscalPeriodDto, GenerateFiscalYearDto } from '../dto/fiscal-period.dto';

@Injectable()
export class FiscalPeriodsService {
  constructor(
    @InjectRepository(FiscalPeriod)
    private readonly periodRepo: Repository<FiscalPeriod>,
  ) {}

  findAllForCompany(companyId: string) {
    return this.periodRepo.find({ where: { companyId }, order: { startDate: 'ASC' } });
  }

  // إنشاء فترة واحدة يدوياً، مع رفض أي تداخل تاريخي مع فترة موجودة لنفس الشركة
  async create(dto: CreateFiscalPeriodDto) {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('تاريخ البداية يجب أن يسبق تاريخ النهاية');
    }
    await this.assertNoOverlap(dto.companyId, dto.startDate, dto.endDate);

    const period = this.periodRepo.create({
      companyId: dto.companyId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: 'open',
    });
    return this.periodRepo.save(period);
  }

  // توليد 12 فترة شهرية دفعة واحدة لسنة معينة، مع تجاهل أي شهر يتداخل مع فترة موجودة مسبقاً
  async generateYear(dto: GenerateFiscalYearDto) {
    const existing = await this.periodRepo.find({ where: { companyId: dto.companyId } });
    const created: FiscalPeriod[] = [];
    const skipped: string[] = [];

    for (let month = 0; month < 12; month++) {
      const start = new Date(Date.UTC(dto.year, month, 1));
      const end = new Date(Date.UTC(dto.year, month + 1, 0));
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);

      const overlaps = existing.some((p) => startDate <= p.endDate && endDate >= p.startDate);
      if (overlaps) {
        skipped.push(startDate.slice(0, 7));
        continue;
      }

      const period = this.periodRepo.create({
        companyId: dto.companyId,
        startDate,
        endDate,
        status: 'open',
      });
      const saved = await this.periodRepo.save(period);
      created.push(saved);
      existing.push(saved);
    }

    return { created, skipped };
  }

  async close(id: string) {
    const period = await this.findOneOrFail(id);
    period.status = 'closed';
    return this.periodRepo.save(period);
  }

  async reopen(id: string) {
    const period = await this.findOneOrFail(id);
    period.status = 'open';
    return this.periodRepo.save(period);
  }

  // الفترة النشطة الحالية: أول فترة مفتوحة يقع تاريخ اليوم داخلها، وإلا آخر فترة مفتوحة كحل احتياطي
  async findActive(companyId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const periods = await this.periodRepo.find({
      where: { companyId, status: 'open' },
      order: { startDate: 'DESC' },
    });

    const covering = periods.find((p) => p.startDate <= today && p.endDate >= today);
    if (covering) return covering;

    if (periods.length > 0) return periods[0];

    throw new NotFoundException('لا توجد فترة مالية مفتوحة لهذه الشركة، يجب إنشاء فترة أولاً');
  }

  private async findOneOrFail(id: string) {
    const period = await this.periodRepo.findOne({ where: { id } });
    if (!period) throw new NotFoundException('الفترة المالية غير موجودة');
    return period;
  }

  private async assertNoOverlap(companyId: string, startDate: string, endDate: string) {
    const existing = await this.periodRepo.find({ where: { companyId } });
    const overlaps = existing.some((p) => startDate <= p.endDate && endDate >= p.startDate);
    if (overlaps) {
      throw new BadRequestException('هذه الفترة تتداخل مع فترة مالية موجودة مسبقاً لنفس الشركة');
    }
  }
}
