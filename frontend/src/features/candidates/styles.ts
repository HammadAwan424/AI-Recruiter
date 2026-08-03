import { Card, Dialog, styled } from "@mui/material";

export const CandidateCardSurface = styled(Card)<{ istoprank?: boolean }>(
  ({ theme, istoprank }) => ({
    backgroundColor: istoprank ? "rgba(250, 204, 21, 0.05)" : "rgba(0, 0, 0, 0.2)",
    borderRadius: Number(theme.shape.borderRadius) * 1.5,
    border: istoprank ? "1px solid rgba(250, 204, 21, 0.5)" : "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: istoprank ? "0 0 15px rgba(250, 204, 21, 0.1)" : "none",
    padding: theme.spacing(2.5),
    color: "#FFFFFF",
    transition: "all 0.3s ease",
    "&:hover": {
      borderColor: theme.palette.primary.main,
    },
  })
);

export const ProfileModalSurface = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: Number(theme.shape.borderRadius) * 2,
    backgroundColor: "#1F1F1F",
    border: "1px solid rgba(5, 220, 127, 0.2)",
    boxShadow: "0 0 30px rgba(5, 220, 127, 0.15)",
    color: "#FFFFFF",
  },
}));
