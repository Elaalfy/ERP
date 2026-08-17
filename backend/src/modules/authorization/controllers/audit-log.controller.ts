import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { GroupManagerGuard } from '../../auth/guards/group-manager.guard';

@Controller('authorization/audit-log')
@UseGuards(GroupManagerGuard)
export class AuditLogController {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  @Get()
  async list(
    @Query('companyId') companyId?: string,
    @Query('module') module?: string,
    @Query('limit') limit?: string,
  ) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC').take(limit ? Number(limit) : 100);
    if (companyId) qb.andWhere('a.companyId = :companyId', { companyId });
    if (module) qb.andWhere('a.module = :module', { module });
    return qb.getMany();
  }
}
