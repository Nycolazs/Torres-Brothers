import { UserAccessStatus } from '@/types';

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
