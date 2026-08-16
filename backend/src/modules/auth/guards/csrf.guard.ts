import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
// مسارات لا تحتاج CSRF لأنها لا تعتمد على وجود جلسة كوكي مسبقة (تسجيل الدخول/التحديث نفسه)
const EXEMPT_PATHS = ['/auth/login', '/auth/refresh'];

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.includes(req.method) || EXEMPT_PATHS.some((p) => req.path.startsWith(p))) {
      return true;
    }

    const cookieToken = req.cookies?.csrf_token;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('رمز CSRF غير صالح أو مفقود');
    }
    return true;
  }
}
