import { baseApi } from "../../shared/api/baseApi";
import { ApplicationListItem, ApplicationDetail, FetchApplicationsResponse } from "../../shared/types/candidate.types";

export const candidatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApplications: builder.query<ApplicationListItem[], number>({
      query: (jobId) => `/jobs/${jobId}/applications/`,
      providesTags: (_result, _error, jobId) => [{ type: "Applications", id: jobId }],
    }),
    getApplicationDetail: builder.query<ApplicationDetail, { jobId: number; applicationId: number }>({
      query: ({ jobId, applicationId }) => `/jobs/${jobId}/applications/${applicationId}`,
      providesTags: (_result, _error, { applicationId }) => [{ type: "Applications", id: applicationId }],
    }),
    fetchNewCVs: builder.mutation<FetchApplicationsResponse, number>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/applications/new`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Applications", id: jobId },
        { type: "Jobs", id: jobId },
      ],
    }),
    parseApplications: builder.mutation<any[], { jobId: number; applicationIds: number[] }>({
      query: ({ jobId, applicationIds }) => ({
        url: `/jobs/${jobId}/applications/parse`,
        method: "POST",
        body: { application_ids: applicationIds },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: "Applications", id: jobId }],
    }),
    screenApplications: builder.mutation<{ message: string }, number>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/applications/screen`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, jobId) => [{ type: "Applications", id: jobId }],
    }),
    updateApplicationStage: builder.mutation<
      { message: string; application_id: number; current_status: string; disposition?: string },
      { jobId: number; applicationId: number; currentStatus?: string; disposition?: string }
    >({
      query: ({ jobId, applicationId, currentStatus, disposition }) => ({
        url: `/jobs/${jobId}/applications/${applicationId}/stage`,
        method: "PUT",
        body: { current_status: currentStatus, disposition },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: "Applications", id: jobId }],
    }),
    hireCandidate: builder.mutation<{ message: string; email_sent?: boolean }, number>({
      query: (applicationId) => ({
        url: `/applications/${applicationId}/hire`,
        method: "POST",
      }),
      invalidatesTags: ["Applications"],
    }),
    rejectCandidate: builder.mutation<{ message: string }, number>({
      query: (applicationId) => ({
        url: `/applications/${applicationId}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Applications"],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useLazyGetApplicationsQuery,
  useGetApplicationDetailQuery,
  useLazyGetApplicationDetailQuery,
  useFetchNewCVsMutation,
  useParseApplicationsMutation,
  useScreenApplicationsMutation,
  useUpdateApplicationStageMutation,
  useHireCandidateMutation,
  useRejectCandidateMutation,
} = candidatesApi;
