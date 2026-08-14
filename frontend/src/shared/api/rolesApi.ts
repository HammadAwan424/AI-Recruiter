import { baseApi } from "./baseApi";
import { RolesListResponse, RolePermissionUpdatePayload, JobScope } from "../types/role.types";

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyRoles: builder.query<RolesListResponse, void>({
      query: () => "/users/roles",
      providesTags: ["Roles"],
    }),
    updateRolePermissions: builder.mutation<
      { message: string; role_id: number; job_scope?: JobScope; permissions: string[] },
      { roleId: number; payload: RolePermissionUpdatePayload }
    >({
      query: ({ roleId, payload }) => ({
        url: `/users/roles/${roleId}/permissions`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Roles", "Users"],
    }),
  }),
});

export const {
  useGetCompanyRolesQuery,
  useLazyGetCompanyRolesQuery,
  useUpdateRolePermissionsMutation,
} = rolesApi;
