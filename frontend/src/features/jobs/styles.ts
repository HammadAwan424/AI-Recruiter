import { Card, Dialog, styled } from "@mui/material";

export const GlassContainerCard = styled(Card)(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  backdropFilter: "blur(8px)",
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: "1px solid rgba(5, 220, 127, 0.2)",
  boxShadow: "0 0 15px rgba(5, 220, 127, 0.15)",
  padding: theme.spacing(3),
  color: "#FFFFFF",
}));

export const JobModalSurface = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: Number(theme.shape.borderRadius) * 2,
    backgroundColor: "#0B0B0B",
    border: "1px solid rgba(5, 220, 127, 0.3)",
    boxShadow: "0 0 25px rgba(5, 220, 127, 0.25)",
    color: "#FFFFFF",
  },
}));
