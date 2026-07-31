import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#05DC7F",
      contrastText: "#000000",
    },
    secondary: {
      main: "#3B82F6",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#121212",
      paper: "#1E1E1E",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
    divider: "rgba(5, 220, 127, 0.25)",
    action: {
      hover: "rgba(5, 220, 127, 0.08)",
      selected: "rgba(5, 220, 127, 0.16)",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1A1A1A",
          backgroundImage: "none",
          border: "1px solid rgba(5, 220, 127, 0.3)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
          color: "#FFFFFF",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: "#05DC7F",
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.6)",
          fontWeight: 600,
          "&.Mui-selected": {
            color: "#05DC7F",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#05DC7F",
          color: "#000000",
          fontWeight: 600,
          "&:hover": {
            backgroundColor: "#04c370",
            boxShadow: "0 0 12px rgba(5, 220, 127, 0.4)",
          },
        },
        outlined: {
          borderColor: "rgba(5, 220, 127, 0.5)",
          color: "#05DC7F",
          "&:hover": {
            borderColor: "#05DC7F",
            backgroundColor: "rgba(5, 220, 127, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#FFFFFF",
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.7)",
          },
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(5, 220, 127, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#05DC7F",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.1)",
          color: "#FFFFFF",
        },
        head: {
          color: "rgba(255, 255, 255, 0.7)",
          fontWeight: 600,
          backgroundColor: "rgba(255, 255, 255, 0.03)",
        },
      },
    },
  },
});
