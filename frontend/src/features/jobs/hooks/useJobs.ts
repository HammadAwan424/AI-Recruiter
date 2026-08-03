import { useGetJobsQuery } from "../api";

export const useJobs = () => {
  const { data, isLoading, isError, refetch } = useGetJobsQuery();

  return {
    jobs: data?.jobs || [],
    totalJobs: data?.jobs?.length || 0,
    isLoading,
    isError,
    refetch,
  };
};
