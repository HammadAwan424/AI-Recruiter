import { baseApi } from "./baseApi";
import { OfferResponse, ExecutiveOfferDecision } from "../types/offer.types";

export type { ExecutiveOfferDecision };

export interface OfferApprovalRequest {
  offerId: number;
  payload: ExecutiveOfferDecision;
}

export const approvalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    approveOfferAction: builder.mutation<OfferResponse, OfferApprovalRequest>({
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
