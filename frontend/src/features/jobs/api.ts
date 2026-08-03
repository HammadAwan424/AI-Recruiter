import { baseApi } from "../../shared/api/baseApi";
import { JobPost, JobDetail, JobCreatePayload, JobsListResponse } from "../../shared/types/job.types";

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<JobsListResponse, void>({
      query: () => "/jobs",
      providesTags: ["Jobs"],
    }),
    getJobDetail: builder.query<JobDetail, number>({
      query: (jobId) => `/jobs/${jobId}`,
      providesTags: (_result, _error, jobId) => [{ type: "Jobs", id: jobId }],
    }),
    createJob: builder.mutation<JobPost, JobCreatePayload>({
      query: (payload) => ({
        url: "/jobs",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Jobs"],
    }),
    updateJob: builder.mutation<JobDetail, { id: number; payload: Partial<JobCreatePayload> }>({
      query: ({ id, payload }) => ({
        url: `/jobs/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Jobs", { type: "Jobs", id }],
    }),
    assignUserToJob: builder.mutation<
      { message: string; job_id: number; user_id: number },
      { jobId: number; userId: number }
    >({
      query: ({ jobId, userId }) => ({
        url: `/jobs/${jobId}/assign`,
        method: "POST",
        body: { user_id: userId },
      }),
      invalidatesTags: (_result, _error, { jobId }) => ["Jobs", { type: "Jobs", id: jobId }],
    }),
    deleteJob: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Jobs"],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobDetailQuery,
  useLazyGetJobDetailQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useAssignUserToJobMutation,
  useDeleteJobMutation,
} = jobsApi;
