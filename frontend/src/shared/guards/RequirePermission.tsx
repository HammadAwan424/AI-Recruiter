import React from "react";
import { PermissionKey } from "../types/role.types";
import { usePermission } from "../hooks/usePermission";
import { Box, Typography, Button, Paper, Skeleton } from "@mui/material";
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
    return (
      <Box className="w-full min-h-[420px] p-6 flex flex-col gap-6 bg-black/20 rounded-2xl border border-gray-800/80 animate-pulse">
        <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-4 rounded-2xl border border-gray-800/80">
          <Skeleton variant="rectangular" width={220} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "12px" }} />
          <Skeleton variant="rectangular" width={280} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "12px" }} />
        </Box>

        <Box className="p-6 rounded-2xl bg-black/40 border border-gray-800/80 flex flex-col gap-4">
          <Skeleton variant="rectangular" width="30%" height={28} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "8px" }} />
          <Skeleton variant="rectangular" width="100%" height={160} sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: "14px" }} />
          <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Skeleton variant="rectangular" height={80} sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: "12px" }} />
            <Skeleton variant="rectangular" height={80} sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: "12px" }} />
            <Skeleton variant="rectangular" height={80} sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: "12px" }} />
          </Box>
        </Box>
      </Box>
    );
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
