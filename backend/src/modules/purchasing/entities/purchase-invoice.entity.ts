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
import { Supplier } from './supplier.entity';
import { PurchaseInvoiceLine } from './purchase-invoice-line.entity';

export type PurchasePaymentMethod = 'cash' | 'bank' | 'credit'; // نقدي / تحويل بنكي / آجل (ذمم دائنة)

@Entity('purchase_invoices')
@Unique(['companyId', 'invoiceNumber'])
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'invoice_number', length: 30 })
  invoiceNumber: string;

  // رقم فاتورة المورد الأصلي (مرجعي، للمطابقة عند التدقيق)
  @Column({ name: 'supplier_invoice_ref', length: 50, nullable: true })
  supplierInvoiceRef: string;

  @Column({ name: 'invoice_date', type: 'timestamptz' })
  invoiceDate: Date;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 10 })
  paymentMethod: PurchasePaymentMethod;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ name: 'vat_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  vatAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount: number;

  @Column({ name: 'journal_entry_id', nullable: true })
  journalEntryId: string;

  @OneToMany(() => PurchaseInvoiceLine, (line) => line.purchaseInvoice, { cascade: true })
  lines: PurchaseInvoiceLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
