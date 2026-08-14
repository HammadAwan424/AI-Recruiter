import { baseApi } from "../../shared/api/baseApi";
import { UserRole } from "../../shared/types/auth.types";
import { CEOSignupPayload } from "../../shared/types/user.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  company_id?: number | null;
  user_id: number;
  full_name?: string;
}

export type SignupPayload = CEOSignupPayload;

export interface SignupResponse {
  message: string;
  company_id: number;
  user_id: number;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    signup: builder.mutation<SignupResponse, SignupPayload>({
      query: (payload) => ({
        url: "/auth/signup",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = authApi;
