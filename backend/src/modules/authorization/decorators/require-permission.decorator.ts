import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'view' | 'create' | 'edit' | 'approve' | 'delete' | 'export';

export const PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  module: string;
  action: PermissionAction;
}

// يُستخدم على مستوى كل Handler: يحدد الوحدة والفعل المطلوبين لاجتياز PermissionGuard
export const RequirePermission = (module: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { module, action } as RequiredPermission);
