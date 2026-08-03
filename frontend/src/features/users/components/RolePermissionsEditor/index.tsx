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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { PermissionMatrixCard } from "../../styles";
import { Role, PermissionKey, JobScope } from "../../../../shared/types/role.types";

interface RolePermissionsEditorProps {
  roles: Role[];
  onSavePermissions: (roleId: number, permissionKeys: PermissionKey[], jobScope?: JobScope) => Promise<any> | any;
  isSubmitting: boolean;
}

const ALL_PERMISSION_KEYS: { key: PermissionKey; description: string }[] = [
  { key: "user:change_permissions", description: "Manage Team Roles & Permissions" },
  { key: "user:invite", description: "Invite Team Users" },
  { key: "user:deactivate", description: "Deactivate User Accounts" },
  { key: "user:view", description: "View Team Users & Roles" },
  { key: "job:create", description: "Create & Delete Job Requisitions" },
  { key: "job:approve", description: "Approve Job Postings" },
  { key: "job:close", description: "Close Job Positions" },
  { key: "job:assign_recruiter", description: "Assign Recruiters & Hiring Managers to Job Scope" },
  { key: "job:view", description: "View Job Positions" },
  { key: "candidate:view_compensation", description: "View Candidate Compensation & Salary Data" },
  { key: "candidate:disposition", description: "Reject Candidates / Applications" },
  { key: "candidate:view", description: "View Candidate Applications" },
  { key: "interview:create", description: "Schedule Interviews" },
  { key: "interview:assign", description: "Assign Interviewers to Interview Rounds" },
  { key: "interview:submit_feedback", description: "Conduct Interviews & Submit Scorecards" },
  { key: "interview:reschedule", description: "Reschedule Interviews" },
  { key: "offer:generate", description: "Generate & Send Offer Letters" },
  { key: "offer:approve", description: "Approve Candidate Offer Letters" },
  { key: "offer:view", description: "View Offer Details" },
  { key: "profile:update", description: "Update Profile Info & Password" },
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
  const [activeJobScope, setActiveJobScope] = useState<JobScope>(() =>
    roles.length > 0 ? roles[0].job_scope || "own" : "own"
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleRoleSelect = (role: Role) => {
    setSelectedRoleId(role.id);
    setActivePermissions(role.permissions || []);
    setActiveJobScope(role.job_scope || "own");
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
      await onSavePermissions(activeRole.id, activePermissions, activeJobScope);
      setSaveSuccessMsg(`Permissions and Job Scope for role '${activeRole.name}' updated successfully!`);
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
            Role Permissions & Job Scope Matrix
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

        {/* Job Scope Selector */}
        {activeRole && (
          <FormControl component="fieldset" sx={{ p: 2, background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
            <FormLabel component="legend" sx={{ color: "text.primary", fontWeight: 600, mb: 1 }}>
              Job Access Scope for '{activeRole.name.toUpperCase()}'
            </FormLabel>
            <RadioGroup
              row
              value={activeJobScope}
              onChange={(e) => {
                setSaveSuccessMsg(null);
                setErrorMsg(null);
                setActiveJobScope(e.target.value as JobScope);
              }}
            >
              <FormControlLabel
                value="all"
                control={<Radio size="small" color="primary" />}
                label="All Company Jobs (Company-Wide Access)"
              />
              <FormControlLabel
                value="own"
                control={<Radio size="small" color="primary" />}
                label="Assigned Jobs Only (Explicit UserJobScope Assignment)"
              />
            </RadioGroup>
          </FormControl>
        )}

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
