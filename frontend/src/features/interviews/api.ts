import { baseApi } from "../../shared/api/baseApi";
import { InterviewItem, InterviewSlot, SlotCreatePayload } from "../../shared/types/interview.types";

export const interviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInterviews: builder.query<InterviewItem[], void>({
      query: () => "/interviews",
      providesTags: ["Interviews"],
    }),
    getInterviewSlots: builder.query<InterviewSlot[], void>({
      query: () => "/interviews/slots",
      providesTags: ["Interviews"],
    }),
    createSlot: builder.mutation<InterviewSlot, SlotCreatePayload>({
      query: (payload) => ({
        url: "/interviews/slots",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Interviews"],
    }),
    generateSelfScheduleLink: builder.mutation<{ self_schedule_token: string }, number>({
      query: (interviewId) => ({
        url: `/interviews/${interviewId}/self-schedule-link`,
        method: "POST",
      }),
      invalidatesTags: ["Interviews"],
    }),
  }),
});

export const {
  useGetInterviewsQuery,
  useGetInterviewSlotsQuery,
  useCreateSlotMutation,
  useGenerateSelfScheduleLinkMutation,
} = interviewsApi;
