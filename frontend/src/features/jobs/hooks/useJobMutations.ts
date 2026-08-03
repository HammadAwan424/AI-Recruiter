import { useCreateJobMutation, useDeleteJobMutation } from "../api";
import { JobCreatePayload } from "../../../shared/types/job.types";

export const useJobMutations = () => {
  const [createJobApi, { isLoading: isCreating }] = useCreateJobMutation();
  const [deleteJobApi, { isLoading: isDeleting }] = useDeleteJobMutation();

  const createJob = async (payload: JobCreatePayload) => {
    return await createJobApi(payload).unwrap();
  };

  const deleteJob = async (id: number) => {
    return await deleteJobApi(id).unwrap();
  };

  return {
    createJob,
    deleteJob,
    isSubmitting: isCreating || isDeleting,
  };
};
