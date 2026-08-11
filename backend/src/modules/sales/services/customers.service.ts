import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerLedgerEntry } from '../entities/customer-ledger-entry.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerLedgerEntry)
    private readonly ledgerRepo: Repository<CustomerLedgerEntry>,
  ) {}

  create(dto: Partial<Customer>) {
    const customer = this.customerRepo.create(dto);
    return this.customerRepo.save(customer);
  }

  findAllForCompany(companyId: string) {
    return this.customerRepo.find({ where: { companyId } });
  }

  // الرصيد الحالي المستحق على العميل = مجموع كل حركاته (فواتير آجلة موجبة، تحصيلات سالبة)
  async getBalance(customerId: string): Promise<number> {
    const result = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.customerId = :customerId', { customerId })
      .getRawOne();
    return Number(result.total);
  }
}
