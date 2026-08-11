import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PayrollRun } from './payroll-run.entity';
import { Employee } from './employee.entity';

@Entity('payslips')
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PayrollRun, (run) => run.payslips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payroll_run_id' })
  payrollRun: PayrollRun;

  @Column({ name: 'payroll_run_id' })
  payrollRunId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'basic_salary', type: 'numeric', precision: 14, scale: 2 })
  basicSalary: number;

  @Column({ name: 'allowances', type: 'numeric', precision: 14, scale: 2, default: 0 })
  allowances: number;

  @Column({ name: 'gosi_deduction', type: 'numeric', precision: 14, scale: 2, default: 0 })
  gosiDeduction: number;

  // خصومات إضافية يدوية (سلف، جزاءات) تُدخل عند إنشاء الدورة
  @Column({ name: 'other_deductions', type: 'numeric', precision: 14, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ name: 'net_pay', type: 'numeric', precision: 14, scale: 2 })
  netPay: number;
}
