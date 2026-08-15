import { baseApi } from "../../shared/api/baseApi";
import {
  InterviewDetail,
  InterviewResponse,
  InterviewSlotDetail,
  SlotCreatePayload,
  InterviewerDetail,
  InterviewCreateRequest,
  InterviewPublicSlotResponse,
  InterviewerSlotAssignment,
  InterviewFeedbackResponse,
  InterviewFeedbackCreatePayload,
} from "../../shared/types/interview.types";

export const interviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInterviews: builder.query<InterviewDetail[], void>({
      query: () => "/interviews",
      providesTags: ["Interviews"],
    }),
    getInterviewSlots: builder.query<InterviewSlotDetail[], void>({
      query: () => "/interviews/slots",
      providesTags: ["Interviews"],
    }),
    getInterviewersWithSlots: builder.query<InterviewerDetail[], number | void>({
      query: (jobId) => (jobId ? `/interviews/interviewers?job_id=${jobId}` : "/interviews/interviewers"),
      providesTags: ["Interviews"],
    }),
    downloadInterviewCalendar: builder.mutation<string, number>({
      query: (interviewId) => ({
        url: `/interviews/${interviewId}/ical`,
        responseHandler: "text",
      }),
    }),
    createSlot: builder.mutation<InterviewSlotDetail, SlotCreatePayload>({
      query: (payload) => ({
        url: "/interviews/slots",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Interviews"],
    }),
    updateSlot: builder.mutation<InterviewSlotDetail, { slotId: number; payload: SlotCreatePayload }>({
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
    scheduleInterview: builder.mutation<InterviewResponse, InterviewCreateRequest>({
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
    confirmCandidateSchedule: builder.mutation<InterviewResponse, { token: string; assignments: InterviewerSlotAssignment[] }>({
      query: ({ token, assignments }) => ({
        url: `/interviews/public/schedule/${token}`,
        method: "POST",
        body: { assignments },
      }),
      invalidatesTags: ["Interviews", "Applications"],
    }),
    submitInterviewFeedback: builder.mutation<
      InterviewFeedbackResponse,
      { interviewId: number } & InterviewFeedbackCreatePayload
    >({
      query: ({ interviewId, ...body }) => ({
        url: `/interviews/${interviewId}/feedback`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Interviews", "Applications"],
    }),
    generateSelfScheduleLink: builder.mutation<InterviewResponse, number>({
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
  useDownloadInterviewCalendarMutation,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useScheduleInterviewMutation,
  useGetPublicScheduleSlotsQuery,
  useConfirmCandidateScheduleMutation,
  useSubmitInterviewFeedbackMutation,
  useGenerateSelfScheduleLinkMutation,
} = interviewsApi;
