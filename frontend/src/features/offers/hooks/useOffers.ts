import { useGetOffersQuery, useGetOfferTemplatesQuery } from "../api";

export const useOffers = () => {
  const { data: offersData, isLoading: isOffersLoading, refetch: refetchOffers } = useGetOffersQuery();
  const { data: templatesData, isLoading: isTemplatesLoading } = useGetOfferTemplatesQuery();

  return {
    offers: Array.isArray(offersData) ? offersData : [],
    templates: Array.isArray(templatesData) ? templatesData : [],
    isLoading: isOffersLoading || isTemplatesLoading,
    refetch: refetchOffers,
  };
};
