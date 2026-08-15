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
import { PasswordInput } from "../../../../shared/components/PasswordInput";
import { formatApiError } from "../../../../shared/utils/errorUtils";

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
      setErrorMsg("Full name, email, and password are required.");
      return;
    }

    if (password.trim().length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    try {
      await onSubmit({
        full_name: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("recruiter");
      setDepartment("");
      setPhone("");
      onClose();
    } catch (err: any) {
      setErrorMsg(formatApiError(err, "Failed to create user."));
    }
  };

  return (
    <ModalSurface open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add New Team Member</DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
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

            <PasswordInput
              label="Initial Password"
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

            <TextField
              label="Department (Optional)"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <TextField
              label="Phone Number (Optional)"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </DialogActions>
      </form>
    </ModalSurface>
  );
};
