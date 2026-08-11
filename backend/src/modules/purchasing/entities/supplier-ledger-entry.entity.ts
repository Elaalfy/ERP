import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Supplier } from './supplier.entity';

export type SupplierLedgerType = 'invoice' | 'payment' | 'adjustment';

// موجب = دين للمورد على الشركة (فاتورة شراء آجلة) / سالب = دفعة سداد للمورد
@Entity('supplier_ledger')
export class SupplierLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @Column({ type: 'varchar', length: 15 })
  type: SupplierLedgerType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
