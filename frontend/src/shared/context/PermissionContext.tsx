import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useGetCompanyRolesQuery } from "../api/rolesApi";
import { PermissionKey, Role } from "../types/role.types";

interface PermissionContextType {
  permissions: PermissionKey[];
  isLoading: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  hasDomain: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
  refetchPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { role, isAuthenticated } = useAuth();

  const { data: rolesData, isLoading: isRolesLoading, refetch } = useGetCompanyRolesQuery(undefined, {
    skip: !isAuthenticated || !role,
  });

  const [permissions, setPermissions] = useState<PermissionKey[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !role) {
      setPermissions([]);
      return;
    }

    if (rolesData && Array.isArray(rolesData.roles)) {
      const userRoleObj = rolesData.roles.find((r: Role) => r.name === role);
      if (userRoleObj && Array.isArray(userRoleObj.permissions)) {
        setPermissions(userRoleObj.permissions);
      } else {
        setPermissions([]);
      }
    } else {
      setPermissions([]);
    }
  }, [role, isAuthenticated, rolesData]);

    const hasDomain = useCallback(
    (key: PermissionKey): boolean => {
      if (permissions.includes("*") || permissions.includes(key)) return true;
      return permissions.some((p) => key.startsWith(p));
    },
    [permissions]
  );

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => {
      if (permissions.includes("*") || permissions.includes(key)) return true;
      return permissions.some((p) => key.startsWith(p));
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (keys: PermissionKey[] = []): boolean => {
      return keys.some((k) => hasPermission(k));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (keys: PermissionKey[] = []): boolean => {
      return keys.every((k) => hasPermission(k));
    },
    [hasPermission]
  );

  const value: PermissionContextType = {
    permissions,
    isLoading: isRolesLoading,
    hasPermission,
    hasAnyPermission,
    hasDomain,
    hasAllPermissions,
    refetchPermissions: refetch,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermissionContext = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return context;
};
