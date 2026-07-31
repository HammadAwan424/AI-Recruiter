import React from "react";
import { PermissionKey } from "../types/role.types";
import { usePermission } from "../hooks/usePermission";
import { Box, Typography, Button, Paper } from "@mui/material";
import { FaLock } from "react-icons/fa";

interface RequirePermissionProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallback,
}) => {
  const { hasPermission, isLoading } = usePermission();

  if (isLoading) {
    return null;
  }

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          textAlign: "center",
          maxWidth: 480,
          borderRadius: 4,
          backgroundColor: "#1A1A1A",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
          }}
        >
          <FaLock size={28} color="#EF4444" />
        </Box>

        <Typography variant="h5" color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: "auto", mb: 3 }}>
          You do not have the required permission (
          <Box component="span" sx={{ fontFamily: "monospace", color: "#EF4444" }}>
            {permission}
          </Box>
          ) to access this feature. Please contact your system administrator.
        </Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={() => window.history.back()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Go Back
        </Button>
      </Paper>
    </Box>
  );
};
