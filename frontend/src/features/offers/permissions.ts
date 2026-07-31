import { PermissionKey } from "../../shared/types/role.types";

export const OFFER_PERMISSIONS = {
  CREATE_OFFER: "create_offer" as PermissionKey,
  APPROVE_REQUISITION: "approve_requisition" as PermissionKey,
} as const;
