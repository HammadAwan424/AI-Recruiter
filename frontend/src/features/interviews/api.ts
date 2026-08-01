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
    scheduleInterview: builder.mutation<
      InterviewItem,
      { application_id: number; scheduled_date: string; scheduled_time: string; interviewer_ids?: number[] }
    >({
      query: (payload) => ({
        url: "/interviews",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Interviews", "Applications"],
    }),
    assignInterviewer: builder.mutation<
      { message: string },
      { interviewId: number; payload: { interviewer_ids: number[] } }
    >({
      query: ({ interviewId, payload }) => ({
        url: `/interviews/${interviewId}/assign-interviewer`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Interviews", "Applications"],
    }),
    submitInterviewFeedback: builder.mutation<
      { message: string },
      { interviewId: number; technical_score: number; communication_score: number; notes?: string }
    >({
      query: ({ interviewId, ...body }) => ({
        url: `/interviews/${interviewId}/feedback`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Interviews", "Applications"],
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
  useScheduleInterviewMutation,
  useAssignInterviewerMutation,
  useSubmitInterviewFeedbackMutation,
  useGenerateSelfScheduleLinkMutation,
} = interviewsApi;
