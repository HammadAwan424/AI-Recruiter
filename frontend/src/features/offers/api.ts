import { baseApi } from "../../shared/api/baseApi";
import {
  OfferResponse,
  OfferTemplateResponse,
  OfferCreatePayload,
  OfferUpdatePayload,
  OfferTemplateCreatePayload,
  ExecutiveOfferDecision,
  OfferPublicResponse,
  CandidateOfferDecision,
} from "../../shared/types/offer.types";

export const offersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query<OfferResponse[], void>({
      query: () => "/offers",
      providesTags: ["Offers"],
    }),
    getOfferDetail: builder.query<OfferResponse, number>({
      query: (offerId) => `/offers/${offerId}`,
      providesTags: (_result, _error, offerId) => [{ type: "Offers", id: offerId }],
    }),
    getOfferTemplates: builder.query<OfferTemplateResponse[], void>({
      query: () => "/templates",
      providesTags: ["OfferTemplates"],
    }),
    createOfferTemplate: builder.mutation<OfferTemplateResponse, OfferTemplateCreatePayload>({
      query: (payload) => ({
        url: "/templates",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["OfferTemplates"],
    }),
    updateOfferTemplate: builder.mutation<OfferTemplateResponse, { id: number } & OfferTemplateCreatePayload>({
      query: ({ id, ...payload }) => ({
        url: `/templates/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["OfferTemplates"],
    }),
    deleteOfferTemplate: builder.mutation<{ message: string }, number>({
      query: (templateId) => ({
        url: `/templates/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OfferTemplates"],
    }),
    createOffer: builder.mutation<OfferResponse, OfferCreatePayload>({
      query: (payload) => ({
        url: "/offers",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Offers", "Applications"],
    }),
    updateOffer: builder.mutation<OfferResponse, { id: number; payload: OfferUpdatePayload }>({
      query: ({ id, payload }) => ({
        url: `/offers/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Offers", "Applications"],
    }),
    deleteOffer: builder.mutation<{ message: string }, number>({
      query: (offerId) => ({
        url: `/offers/${offerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Offers", "Applications"],
    }),
    recordExecutiveOfferDecision: builder.mutation<
      OfferResponse,
      { offerId: number; payload: ExecutiveOfferDecision }
    >({
      query: ({ offerId, payload }) => ({
        url: `/offers/${offerId}/decisions`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Offers", "Applications"],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOfferDetailQuery,
  useGetOfferTemplatesQuery,
  useCreateOfferTemplateMutation,
  useUpdateOfferTemplateMutation,
  useDeleteOfferTemplateMutation,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useRecordExecutiveOfferDecisionMutation,
} = offersApi;
