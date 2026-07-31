import { baseApi } from "../../shared/api/baseApi";

export interface CeoProfile {
  full_name: string;
  email: string;
  company_name: string;
}

export interface CeoProfileUpdatePayload {
  full_name: string;
  company_name: string;
  password?: string | null;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCeoProfile: builder.query<CeoProfile, void>({
      query: () => "/ceo/profile",
      providesTags: ["Users"],
    }),
    updateCeoProfile: builder.mutation<CeoProfile, CeoProfileUpdatePayload>({
      query: (payload) => ({
        url: "/ceo/profile",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetCeoProfileQuery, useUpdateCeoProfileMutation } = settingsApi;
