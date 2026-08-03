import React, { ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { store } from "./store";
import { darkTheme } from "../theme/theme";
import { AuthProvider } from "../shared/context/AuthContext";
import { PermissionProvider } from "../shared/context/PermissionContext";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AuthProvider>
          <PermissionProvider>{children}</PermissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
};
