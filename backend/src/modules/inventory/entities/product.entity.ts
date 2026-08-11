import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Company } from '../../core/entities/company.entity';

@Entity('products')
@Unique(['companyId', 'sku'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 50 })
  sku: string;

  @Column({ name: 'name_ar', length: 150 })
  nameAr: string;

  @Column({ name: 'barcode', length: 50, nullable: true })
  barcode: string;

  @Column({ name: 'sale_price', type: 'numeric', precision: 14, scale: 2 })
  salePrice: number;

  @Column({ name: 'min_stock', type: 'numeric', precision: 14, scale: 2, default: 0 })
  minStock: number;

  @Column({ name: 'max_stock', type: 'numeric', precision: 14, scale: 2, nullable: true })
  maxStock: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
