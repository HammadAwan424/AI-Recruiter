import { baseApi } from "../../shared/api/baseApi";
import { RankedCandidatesResponse } from "../../shared/types/candidate.types";

export const candidatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRankedCandidates: builder.query<RankedCandidatesResponse, number>({
      query: (jobId) => `/recruitment/ranked-candidates/${jobId}`,
      providesTags: ["Applications"],
    }),
    hireCandidate: builder.mutation<{ message: string; email_sent: boolean }, number>({
      query: (applicationId) => ({
        url: `/recruitment/hire/${applicationId}`,
        method: "POST",
      }),
      invalidatesTags: ["Applications"],
    }),
    rejectCandidate: builder.mutation<{ message: string; email_sent: boolean }, number>({
      query: (applicationId) => ({
        url: `/recruitment/reject/${applicationId}`,
        method: "POST",
      }),
      invalidatesTags: ["Applications"],
    }),
  }),
});

export const {
  useGetRankedCandidatesQuery,
  useLazyGetRankedCandidatesQuery,
  useHireCandidateMutation,
  useRejectCandidateMutation,
} = candidatesApi;
