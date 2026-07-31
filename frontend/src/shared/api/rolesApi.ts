import { baseApi } from "./baseApi";
import { RolesListResponse, RolePermissionUpdatePayload, Role } from "../types/role.types";

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyRoles: builder.query<RolesListResponse, void>({
      query: () => "/ceo/roles",
      providesTags: ["Roles"],
    }),
    updateRolePermissions: builder.mutation<
      { message: string; role_id: number; permissions: string[] },
      { roleId: number; payload: RolePermissionUpdatePayload }
    >({
      query: ({ roleId, payload }) => ({
        url: `/ceo/roles/${roleId}/permissions`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetCompanyRolesQuery,
  useLazyGetCompanyRolesQuery,
  useUpdateRolePermissionsMutation,
} = rolesApi;
