import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Stack,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import { PermissionMatrixCard } from "../../styles";
import { Role, PermissionKey } from "../../../../shared/types/role.types";

interface RolePermissionsEditorProps {
  roles: Role[];
  onSavePermissions: (roleId: number, permissionKeys: PermissionKey[]) => Promise<any> | any;
  isSubmitting: boolean;
}

const ALL_PERMISSION_KEYS: { key: PermissionKey; description: string }[] = [
  { key: "change_permissions", description: "Manage Team Roles & Permissions" },
  { key: "view_compensation", description: "View Salary & Compensation Data" },
  { key: "disposition_candidate", description: "Reject Candidates / Applications" },
  { key: "create_requisition", description: "Create & Delete Job Postings" },
  { key: "approve_requisition", description: "Approve & Dispatch Offer Letters (CEO)" },
  { key: "create_offer", description: "Create & Edit Offer Templates" },
  { key: "create_interview", description: "Schedule & Assign Interviews" },
  { key: "take_interview", description: "Conduct Interviews & Submit Scorecards" },
];

export const RolePermissionsEditor: React.FC<RolePermissionsEditorProps> = ({
  roles,
  onSavePermissions,
  isSubmitting,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(() => (roles.length > 0 ? roles[0].id : null));
  const [activePermissions, setActivePermissions] = useState<PermissionKey[]>(() =>
    roles.length > 0 ? roles[0].permissions || [] : []
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleRoleSelect = (role: Role) => {
    setSelectedRoleId(role.id);
    setActivePermissions(role.permissions || []);
    setSaveSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleTogglePermission = (permKey: PermissionKey) => {
    setSaveSuccessMsg(null);
    setErrorMsg(null);

    setActivePermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const handleSave = async () => {
    if (!activeRole) return;
    setSaveSuccessMsg(null);
    setErrorMsg(null);

    try {
      await onSavePermissions(activeRole.id, activePermissions);
      setSaveSuccessMsg(`Permissions for role '${activeRole.name}' updated successfully!`);
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to update role permissions.");
    }
  };

  if (!roles || roles.length === 0) return null;

  return (
    <PermissionMatrixCard>
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Role Permissions Matrix
          </Typography>
          <Button
            variant="contained"
            size="medium"
            onClick={handleSave}
            disabled={isSubmitting}
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
            Save Changes
          </Button>
        </Stack>

        {saveSuccessMsg && <Alert severity="success">{saveSuccessMsg}</Alert>}
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        {/* Role Selector Tabs */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {roles.map((r) => (
            <Chip
              key={r.id}
              label={r.name.toUpperCase()}
              color={selectedRoleId === r.id ? "primary" : "default"}
              variant={selectedRoleId === r.id ? "filled" : "outlined"}
              onClick={() => handleRoleSelect(r)}
              clickable
              sx={{ fontWeight: 600, px: 1, py: 2 }}
            />
          ))}
        </Stack>

        {/* Permission Key Checklist Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={80}>Granted</TableCell>
                <TableCell>Permission Key</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ALL_PERMISSION_KEYS.map((item) => {
                const isChecked = activePermissions.includes(item.key);

                return (
                  <TableRow key={item.key} hover>
                    <TableCell>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleTogglePermission(item.key)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 4 }}>
                        {item.key}
                      </code>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{item.description}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </PermissionMatrixCard>
  );
};
