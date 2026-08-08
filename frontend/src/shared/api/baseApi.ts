import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBaseUrl } from "../utils/config";

const API_BASE_URL = getApiBaseUrl();

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Users", "Roles", "Jobs", "Applications", "Interviews", "Offers", "OfferTemplates"],
  endpoints: () => ({}),
});
