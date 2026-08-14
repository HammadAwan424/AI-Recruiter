import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Stack, Typography, CircularProgress, Alert, Button, Card } from "@mui/material";
import { CheckCircle2, AlertCircle, MailCheck, ArrowRight } from "lucide-react";
import { useExchangeGoogleCodeMutation } from "../../api";
import { formatApiError } from "../../../../shared/utils/errorUtils";
import { CircuitBackground } from "../../../../shared/components/CircuitBackground";

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [exchangeGoogleCode] = useExchangeGoogleCodeMutation();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      hasExecutedRef.current = true;
      setStatus("error");
      setErrorMessage(`Google authorization was denied or encountered an error: ${error}`);
      return;
    }

    if (!code) {
      hasExecutedRef.current = true;
      setStatus("error");
      setErrorMessage("No authorization code received from Google.");
      return;
    }

    hasExecutedRef.current = true;
    const processExchange = async () => {
      try {
        const redirectUri = window.location.origin + "/auth/google/callback";
        const result = await exchangeGoogleCode({
          code,
          state: state || undefined,
          redirect_uri: redirectUri,
        }).unwrap();

        setStatus("success");
        setConnectedEmail(result.mailbox_email);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(formatApiError(err, "Failed to exchange authorization token with Google."));
      }
    };

    processExchange();
  }, [searchParams, exchangeGoogleCode]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A0D14",
        position: "relative",
        overflow: "hidden",
        p: 3,
      }}
    >
      <CircuitBackground />

      <Card
        sx={{
          maxWidth: 520,
          width: "100%",
          p: 4,
          backgroundColor: "rgba(18, 24, 38, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 3,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {status === "loading" && (
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <CircularProgress size={56} sx={{ color: "#05DC7F" }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
              Linking Company Mailbox...
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              Securely exchanging tokens with Google and registering your recruitment inbox.
            </Typography>
          </Stack>
        )}

        {status === "success" && (
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(5, 220, 127, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#05DC7F",
                border: "1px solid rgba(5, 220, 127, 0.3)",
              }}
            >
              <CheckCircle2 size={36} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
              Mailbox Connected!
            </Typography>

            <Alert
              icon={<MailCheck size={20} />}
              severity="success"
              sx={{
                width: "100%",
                textAlign: "left",
                backgroundColor: "rgba(5, 220, 127, 0.1)",
                color: "#05DC7F",
                border: "1px solid rgba(5, 220, 127, 0.3)",
              }}
            >
              Successfully linked <strong>{connectedEmail || "company mailbox"}</strong> to your organization.
            </Alert>

            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              Incoming resumes and candidate applications will now automatically sync to your pipeline.
            </Typography>

            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/jobs")}
              endIcon={<ArrowRight size={18} />}
              sx={{
                height: 48,
                fontWeight: 700,
                backgroundColor: "#05DC7F",
                color: "#000000",
                "&:hover": {
                  backgroundColor: "#04B367",
                },
              }}
            >
              Continue to Candidate Pipeline
            </Button>
          </Stack>
        )}

        {status === "error" && (
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EF4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <AlertCircle size={36} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
              Connection Failed
            </Typography>

            <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
              {errorMessage || "An unexpected error occurred during Google OAuth exchange."}
            </Alert>

            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/settings")}
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  "&:hover": { borderColor: "#FFFFFF" },
                }}
              >
                Go to Settings
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/jobs")}
                sx={{
                  backgroundColor: "#05DC7F",
                  color: "#000000",
                  "&:hover": { backgroundColor: "#04B367" },
                }}
              >
                Go to Dashboard
              </Button>
            </Stack>
          </Stack>
        )}
      </Card>
    </Box>
  );
};
