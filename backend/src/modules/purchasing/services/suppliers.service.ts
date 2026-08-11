import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { SupplierLedgerEntry } from '../entities/supplier-ledger-entry.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierLedgerEntry)
    private readonly ledgerRepo: Repository<SupplierLedgerEntry>,
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
}
