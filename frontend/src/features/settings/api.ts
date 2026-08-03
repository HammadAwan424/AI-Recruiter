import { baseApi } from "../../shared/api/baseApi";

export interface UserProfile {
  full_name: string;
  email: string;
  company_name: string;
}

export interface UserProfileUpdatePayload {
  full_name: string;
  company_name: string;
  password?: string | null;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfile, void>({
      query: () => "/auth/me",
      providesTags: ["Users"],
    }),
    updateUserProfile: builder.mutation<UserProfile, UserProfileUpdatePayload>({
      query: (payload) => ({
        url: "/auth/me",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetUserProfileQuery, useUpdateUserProfileMutation } = settingsApi;
