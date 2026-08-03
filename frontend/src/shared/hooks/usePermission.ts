import { usePermissionContext } from "../context/PermissionContext";
import { PermissionKey } from "../types/role.types";

export interface UsePermissionReturn {
  permissions: PermissionKey[];
  isLoading: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
  refetchPermissions: () => void;
}

export const usePermission = (): UsePermissionReturn => {
  const {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetchPermissions,
  } = usePermissionContext();

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetchPermissions,
  };
};
