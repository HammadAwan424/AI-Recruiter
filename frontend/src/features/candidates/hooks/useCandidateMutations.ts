import { useUpdateApplicationStageMutation } from "../api";
import { ApplicationStatus, ApplicationDisposition } from "../../../shared/types/candidate.types";

export const useCandidateMutations = () => {
  const [updateStageApi, { isLoading: isUpdatingStage }] = useUpdateApplicationStageMutation();

  const updateStage = async (
    jobId: number,
    applicationId: number,
    currentStatus?: ApplicationStatus,
    disposition?: ApplicationDisposition
  ) => {
    return await updateStageApi({
      jobId,
      applicationId,
      currentStatus,
      disposition,
    }).unwrap();
  };

  const hireCandidate = async (jobId: number, applicationId: number) => {
    return await updateStage(jobId, applicationId, "hired");
  };

  const rejectCandidate = async (jobId: number, applicationId: number) => {
    return await updateStage(jobId, applicationId, undefined, "rejected");
  };

  return {
    updateStage,
    hireCandidate,
    rejectCandidate,
    isSubmitting: isUpdatingStage,
  };
};
