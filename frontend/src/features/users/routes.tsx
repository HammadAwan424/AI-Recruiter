import React from "react";
import { RequirePermission } from "../../shared/guards/RequirePermission";
import { USER_PERMISSIONS } from "./permissions";
import { UserManagementPage } from "./screens/UserManagementPage";

export const userRoutes = [
  {
    path: "/users",
    element: (
      <RequirePermission permission={USER_PERMISSIONS.CHANGE_PERMISSIONS}>
        <UserManagementPage />
      </RequirePermission>
    ),
  },
  {
    path: "/ceo/users",
    element: (
      <RequirePermission permission={USER_PERMISSIONS.CHANGE_PERMISSIONS}>
        <UserManagementPage />
      </RequirePermission>
    ),
  },
];
