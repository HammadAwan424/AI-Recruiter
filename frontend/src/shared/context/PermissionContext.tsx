import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useGetMeQuery } from "../../features/users/api";
import { PermissionKey } from "../types/role.types";

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
  const { isAuthenticated } = useAuth();

  const { data: meData, isLoading: isMeLoading, refetch } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [permissions, setPermissions] = useState<PermissionKey[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPermissions([]);
      return;
    }

    if (meData && Array.isArray(meData.permissions)) {
      setPermissions(meData.permissions);
    } else {
      setPermissions([]);
    }
  }, [isAuthenticated, meData]);

  const hasDomain = useCallback(
    (key: PermissionKey): boolean => {
      if (permissions.includes("*") || permissions.includes(key)) return true;
      return permissions.some((p) => key.startsWith(p) || p.startsWith(key));
    },
    [permissions]
  );

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => {
      if (permissions.includes("*") || permissions.includes(key)) return true;
      return permissions.some((p) => key.startsWith(p) || p.startsWith(key));
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
    isLoading: isMeLoading,
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
