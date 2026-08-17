import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// سجل تدقيق غير قابل للتعطيل: من نفّذ، ماذا فعل، وعلى أي شركة/سجل — يُكتب تلقائياً عبر AuditInterceptor
@Entity('audit_log')
@Index(['companyId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 150, nullable: true })
  userEmail: string | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  // اسم الوحدة المشتقة من مسار الطلب (accounting, hr, purchasing...)
  @Column({ length: 40 })
  module: string;

  // الفعل: create/edit/delete/approve/... مشتق من HTTP method + المسار
  @Column({ length: 20 })
  action: string;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 255 })
  path: string;

  // معرّف السجل المتأثر إن وُجد في استجابة الخادم (id)
  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
