import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthContextType, AuthUser, UserRole } from "../types/auth.types";

const AuthContext = createContext<AuthContextType | null>(null);

// The API remains the authority for access control. This fallback only keeps
// the client-side "mine vs team" labels working for sessions created before
// the login response started returning user_id.
const getUserIdFromToken = (storedToken: string | null): number | null => {
  if (!storedToken) return null;

  try {
    const tokenPayload = storedToken.split(".")[1];
    if (!tokenPayload) return null;

    const normalizedPayload = tokenPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=")));
    const parsedUserId = Number(payload.user_id);
    return Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;
  } catch {
    return null;
  }
};

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
    const parsedUserId = uid ? parseInt(uid, 10) : NaN;
    return Number.isInteger(parsedUserId) && parsedUserId > 0
      ? parsedUserId
      : getUserIdFromToken(localStorage.getItem("token"));
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
    localStorage.removeItem("full_name");
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
