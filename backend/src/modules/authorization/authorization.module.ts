import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UserPermission } from './entities/user-permission.entity';
import { AuditLog } from './entities/audit-log.entity';
import { PermissionsService } from './services/permissions.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PermissionsController } from './controllers/permissions.controller';
import { AuditLogController } from './controllers/audit-log.controller';

// Global: يُسجَّل مرة واحدة هنا ويُطبَّق تلقائياً على كل التطبيق.
// PermissionGuard و AuditInterceptor كلاهما "بلا أثر" على أي مسار لا يحمل @RequirePermission صراحة،
// لذا تسجيلهما عامّاً آمن تماماً ولا يكسر أي وحدة لم تُطبَّق عليها الصلاحيات بعد.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserPermission, AuditLog])],
  providers: [
    PermissionsService,
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  controllers: [PermissionsController, AuditLogController],
  exports: [PermissionsService],
})
export class AuthorizationModule {}
