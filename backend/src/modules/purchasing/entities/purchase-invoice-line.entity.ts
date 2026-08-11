import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('purchase_invoice_lines')
export class PurchaseInvoiceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseInvoice, (invoice) => invoice.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchaseInvoice: PurchaseInvoice;

  @Column({ name: 'purchase_invoice_id' })
  purchaseInvoiceId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 4 })
  unitCost: number;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 })
  lineTotal: number;

  // معرّف الدفعة (StockBatch) التي أُنشئت فعلياً من هذا السطر لتتبع الأصل
  @Column({ name: 'stock_batch_id', nullable: true })
  stockBatchId: string;
}
