import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLog } from '../entities/audit-log.entity';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function deriveModule(path: string): string {
  // مثال: /accounting/journal-entries -> accounting ، /hr/employees/:id/advances -> hr
  const segment = path.split('/').filter(Boolean)[0];
  return segment || 'unknown';
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method: string = req.method;

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        // لا نمنع الاستجابة إن فشل التسجيل — سجل التدقيق لا يجب أن يكسر العملية الأصلية
        this.writeLog(req, res, responseBody).catch(() => undefined);
      }),
    );
  }

  private async writeLog(req: any, res: any, responseBody: any) {
    const path: string = req.route?.path || req.originalUrl || req.url;
    const module = req.resolvedModule || deriveModule(path);
    const action = req.resolvedAction || req.method;
    const companyId = req.resolvedCompanyId || req.body?.companyId || req.query?.companyId || null;
    const entityId = responseBody?.id || req.params?.id || null;

    const entry = this.repo.create({
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      companyId,
      module,
      action,
      method: req.method,
      path,
      entityId,
      statusCode: res.statusCode,
      requestBody: req.body || null,
    });
    await this.repo.save(entry);
  }
}
