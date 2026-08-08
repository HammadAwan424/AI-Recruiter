import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { INTERVIEW_PERMISSIONS } from "./permissions";
import { InterviewManagementPage } from "./screens/InterviewManagementPage";

export const interviewRoutes = [
  {
    path: "/interviews",
    element: (
      <RequirePermission permission={INTERVIEW_PERMISSIONS.VIEW}>
        <InterviewManagementPage />
      </RequirePermission>
    ),
  },
];
