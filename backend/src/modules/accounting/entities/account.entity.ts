import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Company } from '../../core/entities/company.entity';
import type { AccountType, NormalBalance } from './coa-template-account.entity';
import { CoaTemplateAccount } from './coa-template-account.entity';

@Entity('accounts')
@Unique(['companyId', 'code'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Account;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ length: 20 })
  code: string;

  @Column({ name: 'name_ar', length: 150 })
  nameAr: string;

  @Column({ name: 'name_en', length: 150, nullable: true })
  nameEn: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20 })
  accountType: AccountType;

  @Column({ name: 'normal_balance', type: 'varchar', length: 10 })
  normalBalance: NormalBalance;

  @Column({ name: 'is_group', default: false })
  isGroup: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => CoaTemplateAccount, { nullable: true })
  @JoinColumn({ name: 'source_template_account_id' })
  sourceTemplateAccount: CoaTemplateAccount;

  @Column({ name: 'source_template_account_id', nullable: true })
  sourceTemplateAccountId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
