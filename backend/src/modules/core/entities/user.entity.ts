import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  fullName: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  // دور المستخدم: group_manager يملك صلاحية الاطلاع على تقارير كل شركات المجموعة مجتمعة
  @Column({ type: 'varchar', length: 20, default: 'employee' })
  role: 'group_manager' | 'accountant' | 'cashier' | 'employee';

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
