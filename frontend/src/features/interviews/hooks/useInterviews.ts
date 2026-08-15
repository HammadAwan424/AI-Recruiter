import {
  useGetInterviewsQuery,
  useGetInterviewSlotsQuery,
  useGetInterviewersWithSlotsQuery,
} from "../api";

export const useInterviews = () => {
  const { data: interviewsData, isLoading: isInterviewsLoading, refetch: refetchInterviews } = useGetInterviewsQuery();
  const { data: slotsData, isLoading: isSlotsLoading, refetch: refetchSlots } = useGetInterviewSlotsQuery();
  const {
    data: interviewersData,
    isLoading: isInterviewersLoading,
    refetch: refetchInterviewers,
  } = useGetInterviewersWithSlotsQuery();

  return {
    interviews: Array.isArray(interviewsData) ? interviewsData : [],
    slots: Array.isArray(slotsData) ? slotsData : [],
    interviewers: Array.isArray(interviewersData) ? interviewersData : [],
    isLoading: isInterviewsLoading || isSlotsLoading || isInterviewersLoading,
    refetch: () => {
      refetchInterviews();
      refetchSlots();
      refetchInterviewers();
    },
  };
};
