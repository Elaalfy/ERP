import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// صلاحية دقيقة (action-based) لمستخدم واحد على وحدة واحدة داخل شركة واحدة.
// الغياب التام لأي صف = لا صلاحية إطلاقاً (Deny by default).
@Entity('user_permissions')
@Index(['userId', 'companyId', 'module'], { unique: true })
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  // اسم الوحدة، مثال: accounting, pos, inventory, purchasing, sales_ar, hr, reports, users
  @Column({ length: 40 })
  module: string;

  @Column({ default: false })
  view: boolean;

  @Column({ default: false })
  create: boolean;

  @Column({ default: false })
  edit: boolean;

  @Column({ default: false })
  approve: boolean;

  @Column({ default: false })
  delete: boolean;

  @Column({ default: false })
  export: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
