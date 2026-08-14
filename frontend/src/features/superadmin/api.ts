import { baseApi } from "../../shared/api/baseApi";
import { UserStatus } from "../../shared/types/auth.types";

export interface CEOResponse {
  id: number;
  full_name: string;
  email: string;
  company_name: string;
  days_left?: number | null;
  status: UserStatus;
  approved_at?: string | null;
  expires_at?: string | null;
}

export const superadminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApprovedCeos: builder.query<CEOResponse[], void>({
      query: () => "/admin/ceos?status=active",
      providesTags: ["Users"],
    }),
    getPendingCeos: builder.query<CEOResponse[], void>({
      query: () => "/admin/ceos?status=pending",
      providesTags: ["Users"],
    }),
    getInactiveCeos: builder.query<CEOResponse[], void>({
      query: () => "/admin/ceos?status=inactive",
      providesTags: ["Users"],
    }),
    getRejectedCeos: builder.query<CEOResponse[], void>({
      query: () => "/admin/ceos?status=rejected",
      providesTags: ["Users"],
    }),
    approveCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/ceos/${id}/status`,
        method: "PUT",
        body: { status: "active" },
      }),
      invalidatesTags: ["Users"],
    }),
    rejectCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/ceos/${id}/status`,
        method: "PUT",
        body: { status: "rejected" },
      }),
      invalidatesTags: ["Users"],
    }),
    deactivateCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/ceos/${id}/status`,
        method: "PUT",
        body: { status: "inactive" },
      }),
      invalidatesTags: ["Users"],
    }),
    activateCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/ceos/${id}/status`,
        method: "PUT",
        body: { status: "active" },
      }),
      invalidatesTags: ["Users"],
    }),
    deleteCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/ceos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetApprovedCeosQuery,
  useGetPendingCeosQuery,
  useGetInactiveCeosQuery,
  useGetRejectedCeosQuery,
  useApproveCeoMutation,
  useRejectCeoMutation,
  useDeactivateCeoMutation,
  useActivateCeoMutation,
  useDeleteCeoMutation,
} = superadminApi;
