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

export interface MailboxStatusResponse {
  is_connected: boolean;
  mailbox_email: string | null;
  provider: string;
  is_active: boolean;
  is_primary?: boolean;
  last_read?: string | null;
}

export interface GoogleAuthUrlResponse {
  auth_url: string;
  state: string;
  redirect_uri: string;
}

export interface ExchangeGoogleCodePayload {
  code: string;
  state?: string;
  redirect_uri?: string;
}

export interface ExchangeGoogleCodeResponse {
  status: string;
  message: string;
  mailbox_email: string;
  company_id: number;
  is_connected: boolean;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Mailbox"],
    }),
    signup: builder.mutation<SignupResponse, SignupPayload>({
      query: (payload) => ({
        url: "/auth/signup",
        method: "POST",
        body: payload,
      }),
    }),
    getGoogleAuthUrl: builder.query<GoogleAuthUrlResponse, string | void>({
      query: (redirectUri) => ({
        url: redirectUri ? `/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}` : "/auth/google/url",
        method: "GET",
      }),
    }),
    exchangeGoogleCode: builder.mutation<ExchangeGoogleCodeResponse, ExchangeGoogleCodePayload>({
      query: (payload) => ({
        url: "/auth/google/exchange",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Mailbox"],
    }),
    getMailboxStatus: builder.query<MailboxStatusResponse, void>({
      query: () => ({
        url: "/auth/google/status",
        method: "GET",
      }),
      providesTags: ["Mailbox"],
    }),
    disconnectMailbox: builder.mutation<{ message: string; is_connected: boolean }, void>({
      query: () => ({
        url: "/auth/google/disconnect",
        method: "POST",
      }),
      invalidatesTags: ["Mailbox"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetGoogleAuthUrlQuery,
  useLazyGetGoogleAuthUrlQuery,
  useExchangeGoogleCodeMutation,
  useGetMailboxStatusQuery,
  useDisconnectMailboxMutation,
} = authApi;

