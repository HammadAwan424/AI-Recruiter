import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { USER_PERMISSIONS } from "./permissions";
import { UserManagementPage } from "./screens/UserManagementPage";

export const userRoutes = [
  {
    path: "/users",
    element: (
      <RequirePermission permission="user:">
        <UserManagementPage />
      </RequirePermission>
    ),
  },
];
