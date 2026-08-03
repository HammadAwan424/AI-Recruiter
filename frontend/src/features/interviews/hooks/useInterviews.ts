import { useGetInterviewsQuery, useGetInterviewSlotsQuery } from "../api";

export const useInterviews = () => {
  const { data: interviewsData, isLoading: isInterviewsLoading, refetch: refetchInterviews } = useGetInterviewsQuery();
  const { data: slotsData, isLoading: isSlotsLoading, refetch: refetchSlots } = useGetInterviewSlotsQuery();

  return {
    interviews: Array.isArray(interviewsData) ? interviewsData : [],
    slots: Array.isArray(slotsData) ? slotsData : [],
    isLoading: isInterviewsLoading || isSlotsLoading,
    refetch: () => {
      refetchInterviews();
      refetchSlots();
    },
  };
};
