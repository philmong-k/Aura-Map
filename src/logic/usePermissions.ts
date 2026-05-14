import { useAuthStore } from '../store/useAuthStore';

/**
 * 전술 캔버스 권한 시스템 (RBAC)
 * Aura 시스템에서 내려온 permissions 배열을 기반으로 기능 접근 제어
 */
export const PERMISSIONS = {
  PLAN_VIEW: 'plan:view',
  PLAN_EDIT: 'plan:edit',
  PLAN_DELETE: 'plan:delete',
  VAULT_MANAGE: 'vault:manage',
} as const;

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  /**
   * 특정 권한을 가지고 있는지 확인
   */
  const hasPermission = (permission: string) => {
    // admin 역할이거나 해당 권한이 배열에 포함되어 있으면 true
    if (user?.role === 'ADMIN' || user?.role === 'admin') return true;
    return permissions.includes(permission);
  };

  /**
   * 보기 가능 여부 (plan:view)
   */
  const canView = hasPermission(PERMISSIONS.PLAN_VIEW);

  /**
   * 편집 가능 여부 (plan:edit)
   */
  const canEdit = hasPermission(PERMISSIONS.PLAN_EDIT);

  /**
   * 삭제 가능 여부 (plan:delete)
   */
  const canDelete = hasPermission(PERMISSIONS.PLAN_DELETE);

  /**
   * 금고(Vault) 관리 가능 여부 (vault:manage)
   */
  const canManageVault = hasPermission(PERMISSIONS.VAULT_MANAGE);

  return {
    permissions,
    hasPermission,
    canView,
    canEdit,
    canDelete,
    canManageVault,
  };
}
