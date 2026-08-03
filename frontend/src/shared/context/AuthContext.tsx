import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthContextType, AuthUser, UserRole } from "../types/auth.types";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token") || null);
  const [role, setRole] = useState<UserRole | null>(() => (localStorage.getItem("role") as UserRole) || null);
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const cid = localStorage.getItem("company_id");
    return cid ? parseInt(cid, 10) : null;
  });
  const [userId, setUserId] = useState<number | null>(() => {
    const uid = localStorage.getItem("user_id");
    return uid ? parseInt(uid, 10) : null;
  });

  const login = (authToken: string, userPayload: AuthUser) => {
    setToken(authToken);
    setRole(userPayload.role);
    setCompanyId(userPayload.company_id || null);
    setUserId(userPayload.user_id);

    localStorage.setItem("token", authToken);
    localStorage.setItem("role", userPayload.role || "");
    if (userPayload.company_id) {
      localStorage.setItem("company_id", userPayload.company_id.toString());
    }
    if (userPayload.user_id) {
      localStorage.setItem("user_id", userPayload.user_id.toString());
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setCompanyId(null);
    setUserId(null);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
    localStorage.removeItem("user_id");
  };

  const value: AuthContextType = {
    token,
    role,
    companyId,
    userId,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
