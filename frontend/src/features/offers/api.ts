import { baseApi } from "../../shared/api/baseApi";
import { OfferItem, OfferTemplate, OfferCreatePayload } from "../../shared/types/offer.types";

export const offersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query<OfferItem[], void>({
      query: () => "/offers",
      providesTags: ["Offers"],
    }),
    getOfferTemplates: builder.query<OfferTemplate[], void>({
      query: () => "/templates",
      providesTags: ["OfferTemplates"],
    }),
    createOfferTemplate: builder.mutation<OfferTemplate, { title: string; department?: string; content: string }>({
      query: (payload) => ({
        url: "/templates",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["OfferTemplates"],
    }),
    updateOfferTemplate: builder.mutation<OfferTemplate, { id: number; title: string; department?: string; content: string }>({
      query: ({ id, ...payload }) => ({
        url: `/templates/${id}`,
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
      invalidatesTags: ["Offers", "Applications"],
    }),
    deleteOffer: builder.mutation<{ message: string }, number>({
      query: (offerId) => ({
        url: `/offers/${offerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Offers", "Applications"],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOfferTemplatesQuery,
  useCreateOfferTemplateMutation,
  useUpdateOfferTemplateMutation,
  useCreateOfferMutation,
  useDeleteOfferMutation,
} = offersApi;
