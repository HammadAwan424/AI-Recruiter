import { useGetCompanyUsersQuery } from "../api";
import { useGetCompanyRolesQuery } from "../../../shared/api/rolesApi";

export const useUsers = () => {
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useGetCompanyUsersQuery();

  const {
    data: rolesData,
    isLoading: isRolesLoading,
    isError: isRolesError,
    refetch: refetchRoles,
  } = useGetCompanyRolesQuery();

  return {
    users: usersData?.users || [],
    totalUsers: usersData?.total_users || 0,
    roles: rolesData?.roles || [],
    isLoading: isUsersLoading || isRolesLoading,
    isError: isUsersError || isRolesError,
    refetchUsers,
    refetchRoles,
  };
};
