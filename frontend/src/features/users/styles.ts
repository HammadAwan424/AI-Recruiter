import { Card, Chip, Dialog, styled } from "@mui/material";

export const UserTableSurface = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  overflow: "hidden",
}));

export const PermissionMatrixCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  padding: theme.spacing(3),
}));

export const RoleBadge = styled(Chip)<{ rolecolor?: "primary" | "secondary" | "success" | "warning" | "info" | "default" }>(
  ({ theme }) => ({
    fontWeight: 600,
    fontSize: "0.75rem",
    borderRadius: theme.shape.borderRadius,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  })
);

export const ModalSurface = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: Number(theme.shape.borderRadius) * 2,
    backgroundColor: "#1A1A1A",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)",
    color: "#FFFFFF",
  },
}));
