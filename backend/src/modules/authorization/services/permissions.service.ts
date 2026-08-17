import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission } from '../entities/user-permission.entity';
import { PermissionAction } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(UserPermission) private readonly repo: Repository<UserPermission>,
  ) {}

  // التحقق الفعلي المستخدم من الحارس: Deny by default — لا صف = لا صلاحية
  async can(userId: string, companyId: string, module: string, action: PermissionAction): Promise<boolean> {
    if (!companyId) return false;
    const row = await this.repo.findOne({ where: { userId, companyId, module } });
    if (!row) return false;
    return !!row[action];
  }

  async listForUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { companyId: 'ASC', module: 'ASC' } });
  }

  async listForUserCompany(userId: string, companyId: string) {
    return this.repo.find({ where: { userId, companyId }, order: { module: 'ASC' } });
  }

  // منح/تحديث صلاحية وحدة واحدة لمستخدم على شركة واحدة (upsert)
  async setPermission(
    userId: string,
    companyId: string,
    module: string,
    flags: Partial<Pick<UserPermission, 'view' | 'create' | 'edit' | 'approve' | 'delete' | 'export'>>,
  ) {
    let row = await this.repo.findOne({ where: { userId, companyId, module } });
    if (!row) {
      row = this.repo.create({ userId, companyId, module });
    }
    Object.assign(row, flags);
    return this.repo.save(row);
  }

  async removePermission(userId: string, companyId: string, module: string) {
    await this.repo.delete({ userId, companyId, module });
    return { ok: true };
  }
}
