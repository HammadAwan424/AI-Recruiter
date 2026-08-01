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
    "user:change_permissions", "user:invite", "user:deactivate", "user:view",
    "job:create", "job:approve", "job:close", "job:assign_recruiter", "job:view",
    "candidate:view_compensation", "candidate:disposition", "candidate:view",
    "interview:create", "interview:assign", "interview:submit_feedback", "interview:reschedule",
    "offer:generate", "offer:approve", "offer:view", "profile:update"
  ],
  hr_manager: [
    "user:change_permissions", "user:invite", "user:deactivate", "user:view",
    "job:create", "job:close", "job:assign_recruiter", "job:view",
    "candidate:view_compensation", "candidate:disposition", "candidate:view",
    "interview:create", "interview:assign", "interview:submit_feedback", "interview:reschedule",
    "offer:generate", "offer:view", "profile:update"
  ],
  recruiter: [
    "job:create", "job:close", "job:assign_recruiter", "job:view",
    "candidate:view_compensation", "candidate:disposition", "candidate:view",
    "interview:create", "interview:assign", "interview:submit_feedback", "interview:reschedule",
    "offer:generate", "offer:view", "profile:update"
  ],
  hiring_manager: [
    "job:view",
    "candidate:disposition", "candidate:view",
    "interview:create", "interview:assign", "interview:submit_feedback", "interview:reschedule",
    "offer:generate", "offer:approve", "offer:view", "profile:update"
  ],
  interviewer: [
    "job:view",
    "candidate:view",
    "interview:submit_feedback",
    "profile:update"
  ],
  employee: [],
  superadmin: ["*"],
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
      if (permissions.includes("*") || permissions.includes(key)) return true;
      if (key.includes(":")) {
        const domain = key.split(":")[0];
        if (permissions.includes(`${domain}:*` as PermissionKey)) return true;
      }
      return false;
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
