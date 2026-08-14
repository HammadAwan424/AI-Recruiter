export type UserRole =
  | "superadmin"
  | "ceo"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "employee";

export type UserStatus = "pending" | "active" | "inactive" | "rejected";

export interface AuthUser {
  user_id: number;
  email: string;
  role: UserRole;
  company_id?: number | null;
  full_name?: string;
}

export interface AuthContextType {
  token: string | null;
  role: UserRole | null;
  companyId: number | null;
  userId: number | null;
  isAuthenticated: boolean;
  login: (authToken: string, userPayload: AuthUser) => void;
  logout: () => void;
}
