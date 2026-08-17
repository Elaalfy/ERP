import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../services/permissions.service';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';

// يحدد الشركة المستهدفة من الطلب نفسه — لا يُوثق بأي companyId قادم من مكان آخر
function resolveCompanyId(req: any): string | undefined {
  return req.body?.companyId || req.query?.companyId || req.params?.companyId;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true; // مسار لم يُعلَّم بصلاحية محددة — لا يخضع لهذا الحارس

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('غير مصرح');
    }

    // مدير المجموعة يتجاوز كل التحقق التفصيلي — وصول كامل لكل الشركات
    if (user.isGroupManager) return true;

    const companyId = resolveCompanyId(req);
    if (!companyId) {
      // Deny by default: لا توجد شركة مستهدفة واضحة بالطلب = رفض
      throw new ForbiddenException('لا يمكن تحديد الشركة المستهدفة لهذا الطلب');
    }

    const allowed = await this.permissionsService.can(user.id, companyId, required.module, required.action);
    if (!allowed) {
      throw new ForbiddenException(
        `لا تملك صلاحية (${required.action}) على وحدة (${required.module}) لهذه الشركة`,
      );
    }

    // يُثبَّت على الطلب ليستخدمه AuditInterceptor لاحقاً بلا إعادة حساب
    req.resolvedCompanyId = companyId;
    req.resolvedModule = required.module;
    req.resolvedAction = required.action;

    return true;
  }
}
