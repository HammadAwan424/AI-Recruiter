import { useCreateSlotMutation, useGenerateSelfScheduleLinkMutation } from "../api";
import { SlotCreatePayload } from "../../../shared/types/interview.types";

export const useInterviewMutations = () => {
  const [createSlotApi, { isLoading: isCreatingSlot }] = useCreateSlotMutation();
  const [generateSelfScheduleLinkApi, { isLoading: isGeneratingLink }] = useGenerateSelfScheduleLinkMutation();

  const createSlot = async (payload: SlotCreatePayload) => {
    return await createSlotApi(payload).unwrap();
  };

  const generateSelfScheduleLink = async (interviewId: number) => {
    return await generateSelfScheduleLinkApi(interviewId).unwrap();
  };

  return {
    createSlot,
    generateSelfScheduleLink,
    isSubmitting: isCreatingSlot || isGeneratingLink,
  };
};
