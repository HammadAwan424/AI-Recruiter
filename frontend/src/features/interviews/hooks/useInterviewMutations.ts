import {
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useGenerateSelfScheduleLinkMutation,
  useDownloadInterviewCalendarMutation,
} from "../api";
import { SlotCreatePayload } from "../../../shared/types/interview.types";

export const useInterviewMutations = () => {
  const [createSlotApi, { isLoading: isCreatingSlot }] = useCreateSlotMutation();
  const [updateSlotApi, { isLoading: isUpdatingSlot }] = useUpdateSlotMutation();
  const [deleteSlotApi, { isLoading: isDeletingSlot }] = useDeleteSlotMutation();
  const [generateSelfScheduleLinkApi, { isLoading: isGeneratingLink }] = useGenerateSelfScheduleLinkMutation();
  const [downloadInterviewCalendarApi, { isLoading: isDownloadingCalendar }] = useDownloadInterviewCalendarMutation();

  const createSlot = async (payload: SlotCreatePayload) => {
    return await createSlotApi(payload).unwrap();
  };

  const updateSlot = async (slotId: number, payload: SlotCreatePayload) => {
    return await updateSlotApi({ slotId, payload }).unwrap();
  };

  const deleteSlot = async (slotId: number) => {
    return await deleteSlotApi(slotId).unwrap();
  };

  const generateSelfScheduleLink = async (interviewId: number) => {
    return await generateSelfScheduleLinkApi(interviewId).unwrap();
  };

  const downloadCalendarInvite = async (interviewId: number) => {
    return await downloadInterviewCalendarApi(interviewId).unwrap();
  };

  return {
    createSlot,
    updateSlot,
    deleteSlot,
    generateSelfScheduleLink,
    downloadCalendarInvite,
    isDownloadingCalendar,
    isSubmitting: isCreatingSlot || isUpdatingSlot || isDeletingSlot || isGeneratingLink,
  };
};
