import { baseApi } from "../../shared/api/baseApi";
import {
  InterviewItem,
  InterviewSlot,
  SlotCreatePayload,
  InterviewerDetail,
  InterviewCreateRequest,
  InterviewPublicSlotResponse,
  InterviewerSlotAssignment,
} from "../../shared/types/interview.types";

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
    getInterviewersWithSlots: builder.query<InterviewerDetail[], number | void>({
      query: (jobId) => (jobId ? `/interviews/interviewers?job_id=${jobId}` : "/interviews/interviewers"),
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
    updateSlot: builder.mutation<InterviewSlot, { slotId: number; payload: SlotCreatePayload }>({
      query: ({ slotId, payload }) => ({
        url: `/interviews/slots/${slotId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Interviews"],
    }),
    deleteSlot: builder.mutation<{ message: string }, number>({
      query: (slotId) => ({
        url: `/interviews/slots/${slotId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Interviews"],
    }),
    scheduleInterview: builder.mutation<InterviewItem, InterviewCreateRequest>({
      query: (request) => ({
        url: "/interviews",
        method: "POST",
        body: request,
      }),
      invalidatesTags: ["Interviews", "Applications"],
    }),
    getPublicScheduleSlots: builder.query<InterviewPublicSlotResponse, string>({
      query: (token) => `/interviews/public/slots/${token}`,
      providesTags: ["Interviews"],
    }),
    confirmCandidateSchedule: builder.mutation<InterviewItem, { token: string; assignments: InterviewerSlotAssignment[] }>({
      query: ({ token, assignments }) => ({
        url: `/interviews/public/schedule/${token}`,
        method: "POST",
        body: { assignments },
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
  useGetInterviewersWithSlotsQuery,
  useLazyGetInterviewersWithSlotsQuery,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useScheduleInterviewMutation,
  useGetPublicScheduleSlotsQuery,
  useConfirmCandidateScheduleMutation,
  useAssignInterviewerMutation,
  useSubmitInterviewFeedbackMutation,
  useGenerateSelfScheduleLinkMutation,
} = interviewsApi;
