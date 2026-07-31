export type PermissionKey =
  | "superadmin"
  | "change_permissions"
  | "view_compensation"
  | "disposition_candidate"
  | "create_requisition"
  | "approve_requisition"
  | "create_offer"
  | "create_interview"
  | "take_interview";

export interface Role {
  id: number;
  name: string;
  company_id: number | null;
  description?: string;
  permissions: PermissionKey[];
}

export interface RolesListResponse {
  company_id: number;
  roles: Role[];
}

export interface RolePermissionUpdatePayload {
  permission_keys: PermissionKey[];
}
