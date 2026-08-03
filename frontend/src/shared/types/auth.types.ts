export type UserRole =
  | "superadmin"
  | "ceo"
  | "hr_manager"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "employee";

export interface AuthUser {
  user_id: number;
  email: string;
  role: UserRole;
  company_id?: number;
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
