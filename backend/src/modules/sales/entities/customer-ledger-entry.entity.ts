import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

export type CustomerLedgerType = 'invoice' | 'collection' | 'adjustment';

// كل حركة آجلة أو تحصيل تُسجَّل هنا، والرصيد الحالي = مجموع amount لكل عميل
@Entity('customer_ledger')
export class CustomerLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 15 })
  type: CustomerLedgerType;

  // موجب = دين على العميل (فاتورة آجلة) / سالب = تحصيل أو تخفيض دين
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
