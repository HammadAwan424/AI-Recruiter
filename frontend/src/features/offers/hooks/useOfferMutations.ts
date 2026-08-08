import {
  useCreateOfferMutation,
  useCreateOfferTemplateMutation,
  useUpdateOfferTemplateMutation,
  useSubmitOfferApprovalMutation,
  useApproveOfferActionMutation,
  useSendOfferMutation,
} from "../api";
import { OfferCreatePayload } from "../../../shared/types/offer.types";

export const useOfferMutations = () => {
  const [createOfferApi, { isLoading: isCreating }] = useCreateOfferMutation();
  const [createOfferTemplateApi, { isLoading: isCreatingTemplate }] = useCreateOfferTemplateMutation();
  const [updateOfferTemplateApi, { isLoading: isUpdatingTemplate }] = useUpdateOfferTemplateMutation();
  const [submitApprovalApi, { isLoading: isSubmittingApproval }] = useSubmitOfferApprovalMutation();
  const [approveActionApi, { isLoading: isApproving }] = useApproveOfferActionMutation();
  const [sendOfferApi, { isLoading: isSending }] = useSendOfferMutation();

  const createOffer = async (payload: OfferCreatePayload) => {
    return await createOfferApi(payload).unwrap();
  };

  const createOfferTemplate = async (payload: { title: string; department?: string; content: string }) => {
    return await createOfferTemplateApi(payload).unwrap();
  };

  const updateOfferTemplate = async (id: number, payload: { title: string; department?: string; content: string }) => {
    return await updateOfferTemplateApi({ id, ...payload }).unwrap();
  };

  const submitOfferApproval = async (offerId: number) => {
    return await submitApprovalApi(offerId).unwrap();
  };

  const approveOfferAction = async (offerId: number, action: "APPROVE" | "REJECT", comments?: string) => {
    return await approveActionApi({ offerId, action, comments }).unwrap();
  };

  const sendOffer = async (offerId: number) => {
    return await sendOfferApi(offerId).unwrap();
  };

  return {
    createOffer,
    createOfferTemplate,
    updateOfferTemplate,
    submitOfferApproval,
    approveOfferAction,
    sendOffer,
    isSubmitting:
      isCreating ||
      isCreatingTemplate ||
      isUpdatingTemplate ||
      isSubmittingApproval ||
      isApproving ||
      isSending,
  };
};
