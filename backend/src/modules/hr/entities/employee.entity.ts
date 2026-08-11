import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Company } from '../../core/entities/company.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ name: 'national_id', length: 20, nullable: true })
  nationalId: string;

  @Column({ length: 100, nullable: true })
  position: string;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate: string;

  @Column({ name: 'basic_salary', type: 'numeric', precision: 14, scale: 2 })
  basicSalary: number;

  // بدلات ثابتة شهرية (سكن، نقل، أخرى) كمبلغ إجمالي واحد لتبسيط النواة الأولى
  @Column({ name: 'fixed_allowances', type: 'numeric', precision: 14, scale: 2, default: 0 })
  fixedAllowances: number;

  // نسبة اشتراك التأمينات الاجتماعية (تحمّل الموظف)، مثال: 0.0975 للسعودية (GOSI)
  @Column({ name: 'gosi_employee_rate', type: 'numeric', precision: 6, scale: 4, default: 0 })
  gosiEmployeeRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
