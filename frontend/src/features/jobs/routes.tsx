import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { JOB_PERMISSIONS } from "./permissions";
import { JobManagementPage } from "./screens/JobManagementPage";

export const jobRoutes = [
  {
    path: "/jobs",
    element: (
      <RequirePermission permission={JOB_PERMISSIONS.CREATE}>
        <JobManagementPage />
      </RequirePermission>
    ),
  },
];
