import { useGetApplicationsQuery } from "../api";
import { ApplicationListItem } from "../../../shared/types/candidate.types";

export const useCandidates = (selectedJobId: number | null) => {
  const { data, isLoading, isError, refetch } = useGetApplicationsQuery(selectedJobId || 0, {
    skip: !selectedJobId,
  });

  const applications: ApplicationListItem[] = Array.isArray(data) ? data : [];

  return {
    applications,
    candidates: applications,
    totalCandidates: applications.length,
    isLoading,
    isError,
    refetch,
  };
};
