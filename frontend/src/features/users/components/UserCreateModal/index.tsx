import React, { useState } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";
import { ModalSurface } from "../../styles";
import { UserCreatePayload } from "../../../../shared/types/user.types";
import { UserRole } from "../../../../shared/types/auth.types";

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UserCreatePayload) => Promise<any> | any;
  isSubmitting: boolean;
}

const AVAILABLE_ROLES: { label: string; value: UserRole }[] = [
  { label: "Recruiter", value: "recruiter" },
  { label: "Hiring Manager", value: "hiring_manager" },
  { label: "Interviewer", value: "interviewer" },
  { label: "Employee", value: "employee" },
];

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("recruiter");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Full Name, Email, and Password are required.");
      return;
    }

    try {
      await onSubmit({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("recruiter");
      setDepartment("");
      setPhone("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to create user. Please check input.");
    }
  };

  return (
    <ModalSurface open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600 }}>Invite New Team Member</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <TextField
              label="Full Name"
              required
              fullWidth
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <TextField
              label="Email Address"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Initial Password"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <TextField
              select
              label="Role"
              required
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {AVAILABLE_ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Department (Optional)"
                fullWidth
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <TextField
                label="Phone (Optional)"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Create User
          </Button>
        </DialogActions>
      </form>
    </ModalSurface>
  );
};
