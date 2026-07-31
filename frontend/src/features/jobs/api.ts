import { baseApi } from "../../shared/api/baseApi";
import { JobPost, JobCreatePayload, JobsListResponse } from "../../shared/types/job.types";

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<JobsListResponse, void>({
      query: () => "/recruitment/jobs",
      providesTags: ["Jobs"],
    }),
    createJob: builder.mutation<JobPost, JobCreatePayload>({
      query: (payload) => ({
        url: "/recruitment/jobs/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Jobs"],
    }),
    deleteJob: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/recruitment/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Jobs"],
    }),
  }),
});

export const { useGetJobsQuery, useCreateJobMutation, useDeleteJobMutation } = jobsApi;
