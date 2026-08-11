import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashierShift } from '../entities/cashier-shift.entity';
import { Invoice } from '../entities/invoice.entity';
import { OpenShiftDto, CloseShiftDto } from '../dto/cashier-shift.dto';

@Injectable()
export class CashierShiftsService {
  constructor(
    @InjectRepository(CashierShift)
    private readonly shiftRepo: Repository<CashierShift>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async open(dto: OpenShiftDto) {
    // منع فتح أكثر من وردية مفتوحة لنفس الكاشير في نفس الوقت
    const existingOpen = await this.shiftRepo.findOne({
      where: { cashierId: dto.cashierId, status: 'open' },
    });
    if (existingOpen) {
      throw new BadRequestException('يوجد وردية مفتوحة بالفعل لهذا الكاشير، يجب إغلاقها أولاً');
    }

    const shift = this.shiftRepo.create({
      companyId: dto.companyId,
      cashierId: dto.cashierId,
      openingCash: dto.openingCash,
      openedAt: new Date(),
      status: 'open',
    });
    return this.shiftRepo.save(shift);
  }

  async close(shiftId: string, dto: CloseShiftDto) {
    const shift = await this.shiftRepo.findOne({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('الوردية غير موجودة');
    if (shift.status === 'closed') throw new BadRequestException('هذه الوردية مُغلقة بالفعل');

    // إجمالي المبيعات النقدية الفعلي المسجل بالنظام لهذه الوردية تحديداً (وليس تقديراً بالوقت)
    const result = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.totalAmount), 0)', 'total')
      .where('inv.shiftId = :shiftId', { shiftId })
      .andWhere('inv.paymentMethod = :method', { method: 'cash' })
      .getRawOne();

    const expectedCashSales = Number(result.total);
    const expectedTotal = Number(shift.openingCash) + expectedCashSales;
    const variance = Number(dto.countedCash) - expectedTotal;

    shift.expectedCashSales = expectedCashSales;
    shift.countedCash = dto.countedCash;
    shift.cashVariance = variance;
    shift.closedAt = new Date();
    shift.status = 'closed';
    shift.notes = dto.notes ?? null;

    return this.shiftRepo.save(shift);
  }

  findAllForCompany(companyId: string) {
    return this.shiftRepo.find({ where: { companyId }, order: { openedAt: 'DESC' } });
  }

  findOne(id: string) {
    return this.shiftRepo.findOne({ where: { id } });
  }
}
