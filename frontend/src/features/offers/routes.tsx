import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { OFFER_PERMISSIONS } from "./permissions";
import { OfferManagementPage } from "./screens/OfferManagementPage";
import { CandidateOfferSignPage } from "./screens/CandidateOfferSignPage";

export const offerRoutes = [
  {
    path: "/offers/public/:token",
    element: <CandidateOfferSignPage />,
  },
  {
    path: "/offers",
    element: (
      <RequirePermission permission="offer:">
        <OfferManagementPage />
      </RequirePermission>
    ),
  },
];
