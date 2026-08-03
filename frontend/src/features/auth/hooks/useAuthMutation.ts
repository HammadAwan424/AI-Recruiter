import { useLoginMutation, useSignupMutation, LoginPayload, SignupPayload } from "../api";
import { useAuth } from "../../../shared/context/AuthContext";
import { UserRole } from "../../../shared/types/auth.types";

export const useAuthMutation = () => {
  const [loginApi, { isLoading: isLoggingIn }] = useLoginMutation();
  const [signupApi, { isLoading: isSigningUp }] = useSignupMutation();
  const { login } = useAuth();

  const loginUser = async (credentials: LoginPayload) => {
    const res = await loginApi(credentials).unwrap();
    
    // Store in AuthContext
    login(res.access_token, {
      user_id: res.user_id,
      email: credentials.email,
      role: res.role as UserRole,
      company_id: res.company_id,
      full_name: res.full_name,
    });

    if (res.full_name) {
      localStorage.setItem("full_name", res.full_name);
    }

    return res;
  };

  const signupUser = async (payload: SignupPayload) => {
    return await signupApi(payload).unwrap();
  };

  return {
    loginUser,
    signupUser,
    isLoading: isLoggingIn || isSigningUp,
  };
};
