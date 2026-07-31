import { baseApi } from "../../shared/api/baseApi";
import {
  CompanyUsersResponse,
  UserCreatePayload,
  UserRoleUpdatePayload,
} from "../../shared/types/user.types";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyUsers: builder.query<CompanyUsersResponse, void>({
      query: () => "/ceo/users",
      providesTags: ["Users"],
    }),
    createCompanyUser: builder.mutation<
      { message: string; user_id: number; full_name: string; email: string; role: string },
      UserCreatePayload
    >({
      query: (payload) => ({
        url: "/ceo/users",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUserRole: builder.mutation<
      { message: string; user_id: number; role: string },
      { userId: number; payload: UserRoleUpdatePayload }
    >({
      query: ({ userId, payload }) => ({
        url: `/ceo/users/${userId}/role`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetCompanyUsersQuery,
  useCreateCompanyUserMutation,
  useUpdateUserRoleMutation,
} = usersApi;
