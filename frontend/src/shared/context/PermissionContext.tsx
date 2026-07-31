import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useGetCompanyRolesQuery } from "../api/rolesApi";
import { PermissionKey, Role } from "../types/role.types";
import { UserRole } from "../types/auth.types";

interface PermissionContextType {
  permissions: PermissionKey[];
  isLoading: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
  refetchPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

const ROLE_PERMISSIONS_FALLBACK: Record<UserRole, PermissionKey[]> = {
  ceo: [
    "change_permissions",
    "view_compensation",
    "disposition_candidate",
    "create_requisition",
    "approve_requisition",
    "create_offer",
    "create_interview",
    "take_interview",
  ],
  hr_manager: [
    "change_permissions",
    "view_compensation",
    "disposition_candidate",
    "create_requisition",
    "create_offer",
    "create_interview",
    "take_interview",
  ],
  recruiter: [
    "view_compensation",
    "disposition_candidate",
    "create_requisition",
    "create_offer",
    "create_interview",
    "take_interview",
  ],
  hiring_manager: [
    "disposition_candidate",
    "create_offer",
    "create_interview",
    "take_interview",
  ],
  interviewer: ["take_interview"],
  employee: [],
  superadmin: [],
};

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
        setPermissions(ROLE_PERMISSIONS_FALLBACK[role] || []);
      }
    } else if (!isRolesLoading) {
      setPermissions(ROLE_PERMISSIONS_FALLBACK[role] || []);
    }
  }, [role, isAuthenticated, rolesData, isRolesLoading]);

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => {
      return permissions.includes(key);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (keys: PermissionKey[] = []): boolean => {
      return keys.some((k) => permissions.includes(k));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (keys: PermissionKey[] = []): boolean => {
      return keys.every((k) => permissions.includes(k));
    },
    [permissions]
  );

  const value: PermissionContextType = {
    permissions,
    isLoading: isRolesLoading,
    hasPermission,
    hasAnyPermission,
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
