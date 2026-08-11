import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Company } from '../../core/entities/company.entity';
import { Product } from './product.entity';

// كل عملية شراء/استلام تُنشئ دفعة جديدة بتكلفتها الفعلية، ويُخصم منها عند البيع بترتيب FIFO (الأقدم أولاً)
@Entity('stock_batches')
export class StockBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 4 })
  unitCost: number;

  @Column({ name: 'quantity_received', type: 'numeric', precision: 14, scale: 3 })
  quantityReceived: number;

  // الكمية المتبقية فعلياً في هذه الدفعة بعد كل عمليات البيع (تُنقص تدريجياً)
  @Column({ name: 'quantity_remaining', type: 'numeric', precision: 14, scale: 3 })
  quantityRemaining: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
