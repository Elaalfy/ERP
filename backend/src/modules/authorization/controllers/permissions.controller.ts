import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { SetPermissionDto } from '../dto/permission.dto';
import { GroupManagerGuard } from '../../auth/guards/group-manager.guard';

// كل هذه المسارات محصورة على isGroupManager فقط — هو الوحيد المخوَّل بضبط صلاحيات أي مستخدم آخر
@Controller('authorization/permissions')
@UseGuards(GroupManagerGuard)
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  listForUser(@Query('userId') userId: string, @Query('companyId') companyId?: string) {
    if (companyId) return this.service.listForUserCompany(userId, companyId);
    return this.service.listForUser(userId);
  }

  @Post()
  setPermission(@Body() dto: SetPermissionDto) {
    const { userId, companyId, module, ...flags } = dto;
    return this.service.setPermission(userId, companyId, module, flags);
  }

  @Delete()
  removePermission(
    @Query('userId') userId: string,
    @Query('companyId') companyId: string,
    @Query('module') module: string,
  ) {
    return this.service.removePermission(userId, companyId, module);
  }
}
