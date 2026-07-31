import { Box, Card, styled } from "@mui/material";

export const AuthContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#121212",
  padding: theme.spacing(2),
  position: "relative",
  overflow: "hidden",
}));

export const AuthCardSurface = styled(Card)(({ theme }) => ({
  backgroundColor: "#1E1E1E",
  borderRadius: Number(theme.shape.borderRadius) * 2.5,
  border: "1px solid rgba(5, 220, 127, 0.3)",
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)",
  padding: theme.spacing(4),
  width: "100%",
  maxWidth: 440,
  zIndex: 1,
}));
