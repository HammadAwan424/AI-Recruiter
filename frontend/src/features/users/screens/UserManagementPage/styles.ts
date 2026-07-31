import { Box, styled } from "@mui/material";

export const PageHeaderCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
}));
