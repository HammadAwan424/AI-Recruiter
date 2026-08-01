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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser, isLoading } = useAuthMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      const res = await loginUser({ email: email.trim(), password });
      
      if (res.role === "superadmin") {
        navigate("/admin/companies");
      } else {
        navigate("/jobs");
      }
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Invalid credentials. Please try again.");
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
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your AGENTRA Recruitment Portal
            </Typography>
          </Stack>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email Address"
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
                autoComplete="current-password"
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
                Sign In
              </Button>
            </Stack>
          </form>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Don't have a company account?
            </Typography>
            <Link component={RouterLink} to="/signup" color="primary.main" underline="hover" sx={{ fontWeight: 600 }}>
              Sign up
            </Link>
          </Stack>
        </Stack>
      </AuthCardSurface>
    </AuthContainer>
  );
};
