import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { CANDIDATE_PERMISSIONS } from "./permissions";
import { CandidatePipelinePage } from "./screens/CandidatePipelinePage";

export const candidateRoutes = [
  {
    path: "/candidates",
    element: (
      <RequirePermission permission={CANDIDATE_PERMISSIONS.DISPOSITION_CANDIDATE}>
        <CandidatePipelinePage />
      </RequirePermission>
    ),
  },
];
