import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Company } from '../../core/entities/company.entity';
import { Customer } from './customer.entity';
import { InvoiceLine } from './invoice-line.entity';
import { InvoiceTemplate } from '../../accounting/entities/invoice-template.entity';

export type PaymentMethod = 'cash' | 'card' | 'credit'; // نقدي / بطاقة / آجل
export type InvoiceStatus = 'posted' | 'cancelled';

@Entity('invoices')
@Unique(['companyId', 'invoiceNumber'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'invoice_number', length: 30 })
  invoiceNumber: string;

  @Column({ name: 'invoice_date', type: 'timestamptz' })
  invoiceDate: Date;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @ManyToOne(() => InvoiceTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: InvoiceTemplate;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 10 })
  paymentMethod: PaymentMethod;

  @Column({ name: 'subtotal', type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ name: 'vat_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  vatAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount: number;

  // إجمالي تكلفة البضاعة المباعة، محسوبة فعلياً من دفعات FIFO المخصومة
  @Column({ name: 'total_cost', type: 'numeric', precision: 14, scale: 4, default: 0 })
  totalCost: number;

  @Column({ name: 'journal_entry_id', nullable: true })
  journalEntryId: string;

  @Column({ name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'varchar', length: 10, default: 'posted' })
  status: InvoiceStatus;

  @OneToMany(() => InvoiceLine, (line) => line.invoice, { cascade: true })
  lines: InvoiceLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
