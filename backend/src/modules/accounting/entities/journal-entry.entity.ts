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
import { User } from '../../core/entities/user.entity';
import { FiscalPeriod } from './fiscal-period.entity';
import { JournalEntryLine } from './journal-entry-line.entity';

export type JournalSourceType = 'sale' | 'collection' | 'purchase' | 'manual' | 'adjustment';
export type JournalStatus = 'draft' | 'posted' | 'reversed';


@Entity('journal_entries')
@Unique(['companyId', 'entryNumber'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => FiscalPeriod)
  @JoinColumn({ name: 'period_id' })
  period: FiscalPeriod;

  @Column({ name: 'period_id' })
  periodId: string;

  @Column({ name: 'entry_number', length: 30 })
  entryNumber: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: string;

  @Column({ name: 'source_type', type: 'varchar', length: 20 })
  sourceType: JournalSourceType;

  @Column({ name: 'source_ref_id', nullable: true })
  sourceRefId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @Column({ name: 'is_manual', default: false })
  isManual: boolean;

  @Column({ type: 'varchar', length: 10, default: 'posted' })
  status: JournalStatus;

  @OneToMany(() => JournalEntryLine, (line) => line.journalEntry, { cascade: true })
  lines: JournalEntryLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
