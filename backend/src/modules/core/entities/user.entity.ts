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

  // عمود قديم أُبقي عليه للتوافق فقط؛ المصدر الفعلي للدور الآن هو UserCompanyRole لكل شركة + isGroupManager أدناه
  @Column({ type: 'varchar', length: 20, default: 'employee' })
  role: 'group_manager' | 'accountant' | 'cashier' | 'employee';

  // مدير مجموعة: يملك صلاحية الاطلاع على تقارير كل الشركات بغض النظر عن أي صف في user_company_roles
  @Column({ name: 'is_group_manager', default: false })
  isGroupManager: boolean;

  @Column({ default: true })
  isActive: boolean;

  // يُجبر المستخدم على تغيير كلمة المرور قبل السماح له بأي إجراء آخر (مُفعَّل افتراضياً لحساب المدير المزروع تلقائياً)
  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  @Column({ name: 'refresh_token_hash', type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
