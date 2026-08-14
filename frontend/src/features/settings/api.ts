import { baseApi } from "../../shared/api/baseApi";
import { UserDetail } from "../../shared/types/user.types";

export interface MyProfileResponse extends UserDetail {
  company_name?: string;
}

export type MyProfile = MyProfileResponse;

export interface MyProfileUpdatePayload {
  full_name?: string;
  company_name?: string;
  old_password?: string | null;
  password?: string | null;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<MyProfileResponse, void>({
      query: () => "/auth/me",
      providesTags: ["Users"],
    }),
    updateMyProfile: builder.mutation<
      { message: string; full_name: string; email: string; company_name: string },
      MyProfileUpdatePayload
    >({
      query: (payload) => ({
        url: "/auth/me",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = settingsApi;
