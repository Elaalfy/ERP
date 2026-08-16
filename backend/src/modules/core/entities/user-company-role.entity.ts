import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';

// يمثل دور مستخدم داخل شركة محددة؛ مستخدم واحد قد يملك أدواراً مختلفة في أكثر من شركة
@Entity('user_company_roles')
@Unique(['userId', 'companyId'])
export class UserCompanyRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 20 })
  role: 'accountant' | 'cashier' | 'employee';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
