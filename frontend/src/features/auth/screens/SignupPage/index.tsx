import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Box,
} from "@mui/material";
import { AuthContainer, AuthCardSurface } from "../../styles";
import { useAuthMutation } from "../../hooks/useAuthMutation";
import { CircuitBackground } from "../../../../shared/components/CircuitBackground";
import logo from "../../../../images/logo.png";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupUser, isLoading } = useAuthMutation();

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!companyName.trim() || !fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      await signupUser({
        company_name: companyName.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      setIsPendingApproval(true);
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Registration failed. Email may already be in use.");
    }
  };

  if (isPendingApproval) {
    return (
      <AuthContainer>
        <CircuitBackground />
        <AuthCardSurface>
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(5, 220, 127, 0.4)",
              }}
            >
              <img src={logo} alt="AI Recruiter" style={{ width: 48, height: 48, objectFit: "contain" }} />
            </Box>

            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
              Registration Submitted!
            </Typography>

            <Alert severity="warning" sx={{ width: "100%", textAlign: "left" }}>
              Your company registration for <strong>{companyName}</strong> has been submitted.
              <br />
              Account Status: <strong>PENDING SUPERADMIN APPROVAL</strong>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Our SuperAdmin team will review your organization request shortly. Once approved, you can sign in to access your recruitment workspace.
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate("/")}
              sx={{
                height: 48,
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              Return to Sign In
            </Button>
          </Stack>
        </AuthCardSurface>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <CircuitBackground />
      <AuthCardSurface>
        <Stack spacing={3}>
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(5, 220, 127, 0.4)",
              }}
            >
              <img src={logo} alt="AI Recruiter" style={{ width: 48, height: 48, objectFit: "contain" }} />
            </Box>
            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
              Register Company
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your organization on AI Recruiter Platform
            </Typography>
          </Stack>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Company Name"
                required
                fullWidth
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />

              <TextField
                label="CEO / Admin Full Name"
                required
                fullWidth
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <TextField
                label="Work Email Address"
                type="email"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <TextField
                label="Password"
                type="password"
                required
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <TextField
                label="Confirm Password"
                type="password"
                required
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                sx={{
                  mt: 1,
                  height: 48,
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                Create Account
              </Button>
            </Stack>
          </form>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
            </Typography>
            <Link component={RouterLink} to="/" color="primary.main" underline="hover" sx={{ fontWeight: 600 }}>
              Sign in
            </Link>
          </Stack>
        </Stack>
      </AuthCardSurface>
    </AuthContainer>
  );
};
