import { baseApi } from "../../shared/api/baseApi";
import { OfferItem, OfferTemplate, OfferCreatePayload } from "../../shared/types/offer.types";

export const offersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query<OfferItem[], void>({
      query: () => "/offers",
      providesTags: ["Offers"],
    }),
    getOfferTemplates: builder.query<OfferTemplate[], void>({
      query: () => "/offers/templates",
      providesTags: ["OfferTemplates"],
    }),
    createOfferTemplate: builder.mutation<OfferTemplate, { title: string; department?: string; content: string }>({
      query: (payload) => ({
        url: "/offers/templates",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["OfferTemplates"],
    }),
    updateOfferTemplate: builder.mutation<OfferTemplate, { id: number; title: string; department?: string; content: string }>({
      query: ({ id, ...payload }) => ({
        url: `/offers/templates/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["OfferTemplates"],
    }),
    createOffer: builder.mutation<OfferItem, OfferCreatePayload>({
      query: (payload) => ({
        url: "/offers",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Offers"],
    }),
    submitOfferApproval: builder.mutation<{ message: string }, number>({
      query: (offerId) => ({
        url: `/offers/${offerId}/submit-approval`,
        method: "POST",
      }),
      invalidatesTags: ["Offers"],
    }),
    approveOfferAction: builder.mutation<{ message: string }, { offerId: number; action: "APPROVE" | "REJECT"; comments?: string }>({
      query: ({ offerId, action, comments }) => ({
        url: `/offers/${offerId}/approval`,
        method: "POST",
        body: { action, comments },
      }),
      invalidatesTags: ["Offers"],
    }),
    sendOffer: builder.mutation<{ message: string; secure_token: string }, number>({
      query: (offerId) => ({
        url: `/offers/${offerId}/send`,
        method: "POST",
      }),
      invalidatesTags: ["Offers"],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOfferTemplatesQuery,
  useCreateOfferTemplateMutation,
  useUpdateOfferTemplateMutation,
  useCreateOfferMutation,
  useSubmitOfferApprovalMutation,
  useApproveOfferActionMutation,
  useSendOfferMutation,
} = offersApi;
