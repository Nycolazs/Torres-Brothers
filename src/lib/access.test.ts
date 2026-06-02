import { describe, expect, it } from 'vitest';
import { hasPermission } from './access';

describe('role permissions', () => {
  it('allows admin to manage users and audit', () => {
    expect(hasPermission('admin', 'admin:write')).toBe(true);
    expect(hasPermission('admin', 'audit:read')).toBe(true);
  });

  it('keeps readonly finance users from writing financial records', () => {
    expect(hasPermission('finance_readonly', 'finance:read')).toBe(true);
    expect(hasPermission('finance_readonly', 'finance:write')).toBe(false);
  });

  it('allows fiscal users to write fiscal records without admin access', () => {
    expect(hasPermission('fiscal', 'fiscal:write')).toBe(true);
    expect(hasPermission('fiscal', 'admin:write')).toBe(false);
  });
});
