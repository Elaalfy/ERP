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
import { Payslip } from './payslip.entity';

export type PayrollRunStatus = 'draft' | 'posted';

// دورة رواتب واحدة لكل شهر لكل شركة (مثال: أغسطس 2026)
@Entity('payroll_runs')
@Unique(['companyId', 'periodMonth', 'periodYear'])
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'period_month', type: 'int' })
  periodMonth: number; // 1-12

  @Column({ name: 'period_year', type: 'int' })
  periodYear: number;

  @Column({ name: 'total_net_pay', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalNetPay: number;

  @Column({ name: 'journal_entry_id', nullable: true })
  journalEntryId: string;

  @Column({ type: 'varchar', length: 10, default: 'draft' })
  status: PayrollRunStatus;

  @OneToMany(() => Payslip, (slip) => slip.payrollRun, { cascade: true })
  payslips: Payslip[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
