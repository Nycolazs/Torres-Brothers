import { UserAccessStatus, UserRole } from '@/types';

export function getAccessRoute(status: UserAccessStatus): string {
  switch (status) {
    case 'approved':
      return '/dashboard';
    case 'rejected':
      return '/acesso-negado';
    case 'pending':
    default:
      return '/aguardando-aprovacao';
  }
}

export type Permission =
  | 'finance:read'
  | 'finance:write'
  | 'fiscal:read'
  | 'fiscal:write'
  | 'contacts:write'
  | 'admin:read'
  | 'admin:write'
  | 'audit:read';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'finance:read',
    'finance:write',
    'fiscal:read',
    'fiscal:write',
    'contacts:write',
    'admin:read',
    'admin:write',
    'audit:read',
  ],
  finance: ['finance:read', 'finance:write', 'contacts:write'],
  finance_readonly: ['finance:read'],
  fiscal: ['finance:read', 'fiscal:read', 'fiscal:write', 'contacts:write'],
  operator: ['finance:read', 'finance:write', 'contacts:write'],
  auditor: ['finance:read', 'fiscal:read', 'audit:read'],
  user: ['finance:read'],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
