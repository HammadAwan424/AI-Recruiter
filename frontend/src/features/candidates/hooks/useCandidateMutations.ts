import { useHireCandidateMutation, useRejectCandidateMutation } from "../api";

export const useCandidateMutations = () => {
  const [hireApi, { isLoading: isHiring }] = useHireCandidateMutation();
  const [rejectApi, { isLoading: isRejecting }] = useRejectCandidateMutation();

  const hireCandidate = async (applicationId: number) => {
    return await hireApi(applicationId).unwrap();
  };

  const rejectCandidate = async (applicationId: number) => {
    return await rejectApi(applicationId).unwrap();
  };

  return {
    hireCandidate,
    rejectCandidate,
    isSubmitting: isHiring || isRejecting,
  };
};
