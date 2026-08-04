import { baseApi } from "../../shared/api/baseApi";
import { AuthUser } from "../../shared/types/auth.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  company_id?: number;
  user_id: number;
  full_name?: string;
}

export interface SignupPayload {
  company_name: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
}

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
