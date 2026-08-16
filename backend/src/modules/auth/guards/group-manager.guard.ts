import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class GroupManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user?.isGroupManager) {
      throw new ForbiddenException('هذا الإجراء متاح فقط لمدير المجموعة');
    }
    return true;
  }
}
