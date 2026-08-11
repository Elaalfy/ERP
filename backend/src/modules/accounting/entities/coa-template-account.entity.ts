import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoaTemplate } from './coa-template.entity';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';

@Entity('coa_template_accounts')
export class CoaTemplateAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CoaTemplate, (template) => template.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: CoaTemplate;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => CoaTemplateAccount, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: CoaTemplateAccount;

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
}
