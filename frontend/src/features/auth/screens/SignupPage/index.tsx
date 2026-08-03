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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!companyName.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    try {
      await signupUser({
        company_name: companyName.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });

      setSuccessMsg("Company account registered successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Registration failed. Email may already be in use.");
    }
  };

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
              <img src={logo} alt="AGENTRA" style={{ width: 48, height: 48, objectFit: "contain" }} />
            </Box>
            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
              Register Company
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your organization on AGENTRA Platform
            </Typography>
          </Stack>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

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
