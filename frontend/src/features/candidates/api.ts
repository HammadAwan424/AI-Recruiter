import { baseApi } from "../../shared/api/baseApi";
import {
  ApplicationListItem,
  ApplicationDetail,
  FetchApplicationsResponse,
  ApplicationStatus,
  ApplicationDisposition,
  ScreeningEvaluationDetail,
  ParsingLLMOutput,
  CommentResponse,
} from "../../shared/types/candidate.types";

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
    parseApplications: builder.mutation<ParsingLLMOutput[], { jobId: number; applicationIds: number[] }>({
      query: ({ jobId, applicationIds }) => ({
        url: `/jobs/${jobId}/applications/parse`,
        method: "POST",
        body: { application_ids: applicationIds },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: "Applications", id: jobId }],
    }),
    screenApplications: builder.mutation<ScreeningEvaluationDetail[], number>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/applications/screen`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, jobId) => [{ type: "Applications", id: jobId }],
    }),
    screenSingleApplication: builder.mutation<ScreeningEvaluationDetail, { jobId: number; applicationId: number }>({
      query: ({ jobId, applicationId }) => ({
        url: `/jobs/${jobId}/applications/screen/${applicationId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [{ type: "Applications", id: applicationId }],
    }),
    updateApplicationStage: builder.mutation<
      { message: string; application_id: number; current_status: ApplicationStatus; disposition: ApplicationDisposition },
      { jobId: number; applicationId: number; currentStatus?: ApplicationStatus; disposition?: ApplicationDisposition }
    >({
      query: ({ jobId, applicationId, currentStatus, disposition }) => ({
        url: `/jobs/${jobId}/applications/${applicationId}/stage`,
        method: "PUT",
        body: { current_status: currentStatus, disposition },
      }),
      invalidatesTags: (_result, _error, { jobId, applicationId }) => [
        { type: "Applications", id: jobId },
        { type: "Applications", id: applicationId },
      ],
    }),
    listApplicationComments: builder.query<CommentResponse[], { jobId: number; applicationId: number }>({
      query: ({ jobId, applicationId }) => `/jobs/${jobId}/applications/${applicationId}/comments`,
      providesTags: (_result, _error, { applicationId }) => [{ type: "Applications", id: applicationId }],
    }),
    addApplicationComment: builder.mutation<CommentResponse, { jobId: number; applicationId: number; content: string }>({
      query: ({ jobId, applicationId, content }) => ({
        url: `/jobs/${jobId}/applications/${applicationId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [{ type: "Applications", id: applicationId }],
    }),
    deleteApplicationComment: builder.mutation<
      { message: string },
      { jobId: number; applicationId: number; commentId: number }
    >({
      query: ({ jobId, applicationId, commentId }) => ({
        url: `/jobs/${jobId}/applications/${applicationId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [{ type: "Applications", id: applicationId }],
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
  useScreenSingleApplicationMutation,
  useUpdateApplicationStageMutation,
  useListApplicationCommentsQuery,
  useAddApplicationCommentMutation,
  useDeleteApplicationCommentMutation,
} = candidatesApi;
