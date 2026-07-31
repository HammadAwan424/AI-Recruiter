import {
  useCreateCompanyUserMutation,
  useUpdateUserRoleMutation,
} from "../api";
import { useUpdateRolePermissionsMutation } from "../../../shared/api/rolesApi";
import { UserCreatePayload } from "../../../shared/types/user.types";
import { UserRole } from "../../../shared/types/auth.types";
import { PermissionKey } from "../../../shared/types/role.types";

export const useUserMutations = () => {
  const [createUserApi, { isLoading: isCreating }] = useCreateCompanyUserMutation();
  const [updateRoleApi, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [updatePermissionsApi, { isLoading: isUpdatingPermissions }] = useUpdateRolePermissionsMutation();

  const createUser = async (payload: UserCreatePayload) => {
    return await createUserApi(payload).unwrap();
  };

  const updateUserRole = async (userId: number, role: UserRole) => {
    return await updateRoleApi({ userId, payload: { role } }).unwrap();
  };

  const updateRolePermissions = async (roleId: number, permissionKeys: PermissionKey[]) => {
    return await updatePermissionsApi({ roleId, payload: { permission_keys: permissionKeys } }).unwrap();
  };

  return {
    createUser,
    updateUserRole,
    updateRolePermissions,
    isSubmitting: isCreating || isUpdatingRole || isUpdatingPermissions,
  };
};
