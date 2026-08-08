import { baseApi } from "./baseApi";
import { OfferItem } from "../types/offer.types";

export type ApprovedExecutiveDecision = {
  decision: "approved";
  comments?: string;
};

export type RejectedExecutiveDecision = {
  decision: "rejected";
  comments?: string;
};

export type ExecutiveOfferDecision = ApprovedExecutiveDecision | RejectedExecutiveDecision;

export interface OfferApprovalRequest {
  offerId: number;
  payload: ExecutiveOfferDecision;
}

export const approvalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    approveOfferAction: builder.mutation<OfferItem, OfferApprovalRequest>({
      query: ({ offerId, payload }) => ({
        url: `/offers/${offerId}/decisions`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Offers", "Applications"],
    }),
  }),
});

export const { useApproveOfferActionMutation } = approvalApi;
