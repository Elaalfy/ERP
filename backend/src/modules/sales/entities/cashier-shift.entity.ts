import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Company } from '../../core/entities/company.entity';
import { User } from '../../core/entities/user.entity';

export type ShiftStatus = 'open' | 'closed';

// وردية كاشير: تبدأ بمبلغ افتتاحي، وتُغلق بمقارنة المبيعات النقدية المسجلة بالنظام مع النقد الفعلي في الدرج
@Entity('cashier_shifts')
export class CashierShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column({ name: 'cashier_id' })
  cashierId: string;

  @Column({ name: 'opening_cash', type: 'numeric', precision: 14, scale: 2, default: 0 })
  openingCash: number;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date;

  // إجمالي المبيعات النقدية المسجلة آلياً بالنظام خلال الوردية (يُحسب وقت الإغلاق)
  @Column({ name: 'expected_cash_sales', type: 'numeric', precision: 14, scale: 2, nullable: true })
  expectedCashSales: number;

  // النقد الفعلي الذي عدّه الكاشير في الدرج عند الإغلاق
  @Column({ name: 'counted_cash', type: 'numeric', precision: 14, scale: 2, nullable: true })
  countedCash: number;

  // الفارق = countedCash - (openingCash + expectedCashSales)، موجب يعني زيادة، سالب يعني عجز
  @Column({ name: 'cash_variance', type: 'numeric', precision: 14, scale: 2, nullable: true })
  cashVariance: number;

  @Column({ type: 'varchar', length: 10, default: 'open' })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
