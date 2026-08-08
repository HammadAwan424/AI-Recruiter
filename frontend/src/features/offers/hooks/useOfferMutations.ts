import {
  useCreateOfferMutation,
  useCreateOfferTemplateMutation,
  useUpdateOfferTemplateMutation,
} from "../api";
import { useApproveOfferActionMutation } from "../../../shared/api/approvalApi";
import { OfferCreatePayload } from "../../../shared/types/offer.types";

export const useOfferMutations = () => {
  const [createOfferApi, { isLoading: isCreating }] = useCreateOfferMutation();
  const [createOfferTemplateApi, { isLoading: isCreatingTemplate }] = useCreateOfferTemplateMutation();
  const [updateOfferTemplateApi, { isLoading: isUpdatingTemplate }] = useUpdateOfferTemplateMutation();
  const [approveActionApi, { isLoading: isApproving }] = useApproveOfferActionMutation();

  const createOffer = async (payload: OfferCreatePayload) => {
    return await createOfferApi(payload).unwrap();
  };

  const createOfferTemplate = async (payload: { title: string; department?: string; content: string }) => {
    return await createOfferTemplateApi(payload).unwrap();
  };

  const updateOfferTemplate = async (id: number, payload: { title: string; department?: string; content: string }) => {
    return await updateOfferTemplateApi({ id, ...payload }).unwrap();
  };

  const approveOfferAction = async (offerId: number, action: "APPROVE" | "REJECT", comments?: string) => {
    const decision = action === "APPROVE" ? "approved" : "rejected";
    return await approveActionApi({
      offerId,
      payload: { decision, comments },
    }).unwrap();
  };

  return {
    createOffer,
    createOfferTemplate,
    updateOfferTemplate,
    approveOfferAction,
    isSubmitting: isCreating || isCreatingTemplate || isUpdatingTemplate || isApproving,
  };
};
