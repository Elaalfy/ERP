import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';

export type EmployeeAdvanceLedgerType = 'advance' | 'deduction' | 'adjustment';

// موجب = سلفة مصروفة للموظف (ذمة على الموظف) / سالب = خصم من راتبه (سداد للسلفة)
@Entity('employee_advance_ledger')
export class EmployeeAdvanceLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'varchar', length: 15 })
  type: EmployeeAdvanceLedgerType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
