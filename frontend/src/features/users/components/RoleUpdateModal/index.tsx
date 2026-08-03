import React, { useState, useEffect } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Typography,
} from "@mui/material";
import { ModalSurface } from "../../styles";
import { CompanyUser } from "../../../../shared/types/user.types";
import { UserRole } from "../../../../shared/types/auth.types";

interface RoleUpdateModalProps {
  open: boolean;
  user: CompanyUser | null;
  onClose: () => void;
  onSubmit: (userId: number, role: UserRole) => Promise<any> | any;
  isSubmitting: boolean;
}

const ROLES: { label: string; value: UserRole }[] = [
  { label: "CEO", value: "ceo" },
  { label: "Recruiter", value: "recruiter" },
  { label: "Hiring Manager", value: "hiring_manager" },
  { label: "Interviewer", value: "interviewer" },
  { label: "Employee", value: "employee" },
];

export const RoleUpdateModal: React.FC<RoleUpdateModalProps> = ({
  open,
  user,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("recruiter");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role as UserRole);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await onSubmit(user.id, selectedRole);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to update user role.");
    }
  };

  return (
    <ModalSurface open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600 }}>Change User Role</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <Typography variant="body2" color="text.secondary">
              Target Member: <strong style={{ color: "white" }}>{user.full_name}</strong> ({user.email})
            </Typography>

            <TextField
              select
              label="Assigned Role"
              required
              fullWidth
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            >
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </ModalSurface>
  );
};
