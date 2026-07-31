import { useGetRankedCandidatesQuery } from "../api";

export const useCandidates = (selectedJobId: number | null) => {
  const { data, isLoading, isError, refetch } = useGetRankedCandidatesQuery(selectedJobId || 0, {
    skip: !selectedJobId,
  });

  return {
    candidates: data?.ranked_list || [],
    totalCandidates: data?.ranked_list?.length || 0,
    isLoading,
    isError,
    refetch,
  };
};
