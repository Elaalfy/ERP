import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { Company } from '../../core/entities/company.entity';
import { InvoiceTemplateField } from './invoice-template-field.entity';

@Entity('invoice_templates')
export class InvoiceTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ name: 'theme_settings', type: 'jsonb', nullable: true })
  themeSettings: Record<string, any>;

  @OneToMany(() => InvoiceTemplateField, (field) => field.template, { cascade: true })
  fields: InvoiceTemplateField[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
