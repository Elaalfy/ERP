import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Company } from '../../core/entities/company.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  // الحد الائتماني المسموح للعميل عند البيع الآجل، 0 يعني لا يسمح بالآجل
  @Column({ name: 'credit_limit', type: 'numeric', precision: 14, scale: 2, default: 0 })
  creditLimit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
