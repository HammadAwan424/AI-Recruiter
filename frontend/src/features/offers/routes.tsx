import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { OFFER_PERMISSIONS } from "./permissions";
import { OfferManagementPage } from "./screens/OfferManagementPage";

export const offerRoutes = [
  {
    path: "/offers",
    element: (
      <RequirePermission permission={OFFER_PERMISSIONS.GENERATE}>
        <OfferManagementPage />
      </RequirePermission>
    ),
  },
];
