import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { CoaTemplateAccount } from './coa-template-account.entity';

@Entity('coa_templates')
export class CoaTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => CoaTemplateAccount, (account) => account.template)
  accounts: CoaTemplateAccount[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
