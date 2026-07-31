import React, { useState } from "react";
import {
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { PageHeaderCard } from "./styles";
import { UserTableSurface, RoleBadge } from "../../styles";
import { useUsers } from "../../hooks/useUsers";
import { useUserMutations } from "../../hooks/useUserMutations";
import { UserCreateModal } from "../../components/UserCreateModal";
import { RoleUpdateModal } from "../../components/RoleUpdateModal";
import { RolePermissionsEditor } from "../../components/RolePermissionsEditor";
import { CompanyUser } from "../../../../shared/types/user.types";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { USER_PERMISSIONS } from "../../permissions";

export const UserManagementPage: React.FC = () => {
  const { users, roles, totalUsers, isLoading, isError } = useUsers();
  const { createUser, updateUserRole, updateRolePermissions, isSubmitting } =
    useUserMutations();
  const { hasPermission } = usePermission();

  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<CompanyUser | null>(null);

  const canManagePermissions = hasPermission(USER_PERMISSIONS.CHANGE_PERMISSIONS);

  const getRoleColor = (roleName: string): "primary" | "secondary" | "success" | "warning" | "info" | "default" => {
    switch (roleName) {
      case "ceo":
        return "primary";
      case "recruiter":
        return "secondary";
      case "hiring_manager":
        return "info";
      case "interviewer":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* Header Section */}
      <PageHeaderCard>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Team Members & Roles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage organization users, role assignments, and permission matrices.
            </Typography>
          </Stack>

          {canManagePermissions && (
            <Button
              variant="contained"
              size="medium"
              onClick={() => setIsCreateModalOpen(true)}
              sx={{
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                height: 42,
                px: 3,
                lineHeight: 1,
              }}
            >
              + Invite Team Member
            </Button>
          )}
        </Stack>
      </PageHeaderCard>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
        <Tab label={`Team Members (${totalUsers})`} value="users" />
        <Tab label="Role Permissions Matrix" value="permissions" />
      </Tabs>

      {/* Tab Content 1: Users Table */}
      {activeTab === "users" && (
        <UserTableSurface>
          {isLoading ? (
            <Stack sx={{ py: 6, alignItems: "center" }}>
              <CircularProgress />
            </Stack>
          ) : isError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Could not fetch company users. Please ensure backend is running.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    {canManagePermissions && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge label={u.role} rolecolor={getRoleColor(u.role)} />
                      </TableCell>
                      <TableCell>{u.department || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.status}
                          size="small"
                          color={u.status === "active" ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      {canManagePermissions && (
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: "flex-end", alignItems: "center" }}
                          >
                            <Tooltip title="Change Role">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setSelectedUserForRole(u)}
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                Change Role
                              </Button>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </UserTableSurface>
      )}

      {/* Tab Content 2: Role Permissions Matrix */}
      {activeTab === "permissions" && (
        <RolePermissionsEditor
          roles={roles}
          onSavePermissions={updateRolePermissions}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Modals */}
      <UserCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createUser}
        isSubmitting={isSubmitting}
      />

      <RoleUpdateModal
        open={Boolean(selectedUserForRole)}
        user={selectedUserForRole}
        onClose={() => setSelectedUserForRole(null)}
        onSubmit={updateUserRole}
        isSubmitting={isSubmitting}
      />
    </Stack>
  );
};
