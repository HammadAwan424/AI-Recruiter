import { baseApi } from "../../shared/api/baseApi";
import { UserRole } from "../../shared/types/auth.types";
import {
  CompanyUsersResponse,
  UserCreatePayload,
  UserRoleUpdatePayload,
  UserDetail,
} from "../../shared/types/user.types";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<UserDetail, void>({
      query: () => "/auth/me",
      providesTags: ["Users"],
    }),
    getCompanyUsers: builder.query<CompanyUsersResponse, UserRole | string | void>({
      query: (role) => (role ? `/users?role=${role}` : "/users"),
      providesTags: ["Users"],
    }),
    createCompanyUser: builder.mutation<
      { message: string; user_id: number; full_name: string; email: string; role: UserRole; company_id: number },
      UserCreatePayload
    >({
      query: (payload) => ({
        url: "/users",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUserRole: builder.mutation<
      { message: string; user_id: number; role: UserRole },
      { userId: number; payload: UserRoleUpdatePayload }
    >({
      query: ({ userId, payload }) => ({
        url: `/users/${userId}/role`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLazyGetMeQuery,
  useGetCompanyUsersQuery,
  useCreateCompanyUserMutation,
  useUpdateUserRoleMutation,
} = usersApi;
