import { baseApi } from "../../shared/api/baseApi";

export interface CompanyUser {
  id: number;
  full_name: string;
  email: string;
  company_name: string;
  days_left?: number | null;
  status?: string;
}

export const superadminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApprovedCeos: builder.query<CompanyUser[], void>({
      query: () => "/admin/approved-ceos",
      providesTags: ["Users"],
    }),
    getPendingCeos: builder.query<CompanyUser[], void>({
      query: () => "/admin/pending-ceos",
      providesTags: ["Users"],
    }),
    getInactiveCeos: builder.query<CompanyUser[], void>({
      query: () => "/admin/inactive-ceos",
      providesTags: ["Users"],
    }),
    getRejectedCeos: builder.query<CompanyUser[], void>({
      query: () => "/admin/rejected-ceos",
      providesTags: ["Users"],
    }),
    approveCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/approve-ceo/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Users"],
    }),
    rejectCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/reject-ceo/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Users"],
    }),
    deactivateCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/deactivate-ceo/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Users"],
    }),
    activateCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/activate-ceo/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Users"],
    }),
    deleteCeo: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/delete-ceo/${id}`,
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
