import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { StockBatch } from '../entities/stock-batch.entity';
import { ReceiveStockDto } from '../dto/product.dto';

export interface FifoConsumptionResult {
  totalCost: number;
  averageUnitCost: number;
  consumedFrom: { batchId: string; quantity: number; unitCost: number }[];
}

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockBatch)
    private readonly batchRepo: Repository<StockBatch>,
  ) {}

  // نسخة تعمل ضمن transaction خارجية (تُستخدم من خدمة فواتير الشراء لضمان الاتساق مع القيد المحاسبي)
  async receiveStockInTransaction(
    manager: EntityManager,
    params: { companyId: string; productId: string; quantity: number; unitCost: number },
  ) {
    const batch = manager.create(StockBatch, {
      companyId: params.companyId,
      productId: params.productId,
      receivedAt: new Date(),
      unitCost: params.unitCost,
      quantityReceived: params.quantity,
      quantityRemaining: params.quantity,
    });
    return manager.save(batch);
  }

  // استلام بضاعة جديدة: يُنشئ دفعة جديدة بتكلفتها الفعلية (أساس FIFO)
  receiveStock(dto: ReceiveStockDto) {
    const batch = this.batchRepo.create({
      companyId: dto.companyId,
      productId: dto.productId,
      receivedAt: new Date(),
      unitCost: dto.unitCost,
      quantityReceived: dto.quantity,
      quantityRemaining: dto.quantity,
    });
    return this.batchRepo.save(batch);
  }

  // الرصيد الحالي = مجموع الكميات المتبقية في كل الدفعات النشطة لهذا المنتج
  async getCurrentStock(productId: string): Promise<number> {
    const result = await this.batchRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.quantityRemaining), 0)', 'total')
      .where('b.productId = :productId', { productId })
      .getRawOne();
    return Number(result.total);
  }

  // القلب: خصم كمية مطلوبة من المخزون بترتيب FIFO (الأقدم أولاً)، ويُرجع التكلفة الفعلية المخصومة
  // يجب استدعاؤها دائماً داخل نفس الـ transaction الخاصة بعملية البيع لضمان الاتساق
  async consumeFifo(
    manager: EntityManager,
    productId: string,
    quantityNeeded: number,
  ): Promise<FifoConsumptionResult> {
    // قفل الصفوف (FOR UPDATE) لمنع تضارب البيع المتزامن على نفس الدفعات
    const batches = await manager
      .createQueryBuilder(StockBatch, 'b')
      .where('b.productId = :productId', { productId })
      .andWhere('b.quantityRemaining > 0')
      .orderBy('b.receivedAt', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    const availableTotal = batches.reduce((sum, b) => sum + Number(b.quantityRemaining), 0);
    if (availableTotal < quantityNeeded) {
      throw new BadRequestException(
        `الكمية المتوفرة (${availableTotal}) أقل من الكمية المطلوبة (${quantityNeeded}) لهذا المنتج`,
      );
    }

    let remainingToConsume = quantityNeeded;
    let totalCost = 0;
    const consumedFrom: { batchId: string; quantity: number; unitCost: number }[] = [];

    for (const batch of batches) {
      if (remainingToConsume <= 0) break;

      const takeFromBatch = Math.min(Number(batch.quantityRemaining), remainingToConsume);
      batch.quantityRemaining = Number(batch.quantityRemaining) - takeFromBatch;
      await manager.save(batch);

      totalCost += takeFromBatch * Number(batch.unitCost);
      consumedFrom.push({ batchId: batch.id, quantity: takeFromBatch, unitCost: Number(batch.unitCost) });
      remainingToConsume -= takeFromBatch;
    }

    return {
      totalCost,
      averageUnitCost: totalCost / quantityNeeded,
      consumedFrom,
    };
  }
}
