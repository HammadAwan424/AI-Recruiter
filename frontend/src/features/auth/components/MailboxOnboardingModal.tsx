import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { Mail, ShieldCheck, Zap, X, ExternalLink } from "lucide-react";
import { useLazyGetGoogleAuthUrlQuery } from "../api";
import { formatApiError } from "../../../shared/utils/errorUtils";

interface MailboxOnboardingModalProps {
  open: boolean;
  onClose?: () => void;
  allowDismiss?: boolean;
}

export const MailboxOnboardingModal: React.FC<MailboxOnboardingModalProps> = ({
  open,
  onClose,
  allowDismiss = true,
}) => {
  const [triggerGetUrl, { isFetching }] = useLazyGetGoogleAuthUrlQuery();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConnectGoogle = async () => {
    setErrorMsg(null);
    try {
      const redirectUri = window.location.origin + "/auth/google/callback";
      const result = await triggerGetUrl(redirectUri).unwrap();
      if (result?.auth_url) {
        window.location.href = result.auth_url;
      } else {
        setErrorMsg("Failed to obtain Google authorization link.");
      }
    } catch (err: any) {
      setErrorMsg(formatApiError(err, "Could not initialize Google OAuth. Please check server configuration."));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={allowDismiss ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#121826",
            backgroundImage: "none",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            overflow: "hidden",
            position: "relative",
          },
        },
      }}
    >
      {allowDismiss && onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "rgba(255, 255, 255, 0.5)",
            "&:hover": { color: "#FFFFFF", backgroundColor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <X size={20} />
        </IconButton>
      )}

      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          {/* Header Icon */}
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              backgroundColor: "rgba(5, 220, 127, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#05DC7F",
              border: "1px solid rgba(5, 220, 127, 0.3)",
              boxShadow: "0 0 24px rgba(5, 220, 127, 0.2)",
            }}
          >
            <Mail size={34} />
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 0.5 }}>
              Connect Company Mailbox
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              Link your organization's recruitment Gmail inbox to unlock automated candidate email syncing and AI resume screening.
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
              {errorMsg}
            </Alert>
          )}

          {/* Value Props */}
          <Stack spacing={2} sx={{ width: "100%", textAlign: "left" }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <Zap size={20} color="#05DC7F" style={{ marginTop: 2, flexShrink: 0 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                  Automated Candidate Email Sync
                </Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                  Seamlessly ingests candidate applications and attachments from your inbox into open job requisitions.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <ShieldCheck size={20} color="#38BDF8" style={{ marginTop: 2, flexShrink: 0 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                  Secure Enterprise OAuth
                </Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                  Direct Google OAuth 2.0 authorization with isolated tokens. Passwords are never stored.
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Actions */}
          <Stack spacing={1.5} sx={{ width: "100%", pt: 1 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleConnectGoogle}
              disabled={isFetching}
              startIcon={isFetching ? <CircularProgress size={20} color="inherit" /> : <ExternalLink size={20} />}
              sx={{
                height: 48,
                fontWeight: 700,
                fontSize: "1rem",
                backgroundColor: "#05DC7F",
                color: "#000000",
                "&:hover": {
                  backgroundColor: "#04B367",
                },
              }}
            >
              {isFetching ? "Redirecting to Google..." : "Connect with Google (Gmail)"}
            </Button>

            {allowDismiss && onClose && (
              <Button
                variant="text"
                fullWidth
                onClick={onClose}
                sx={{
                  color: "#94A3B8",
                  "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
                }}
              >
                Skip for now (I'll connect later in Settings)
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
