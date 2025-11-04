import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#00a353", // main green
      dark: "#17442D", // dark green
      light: "#e8eddb",
    },
    secondary: {
      main: "#ffffff", // white
      light: "#CACCC6", // grey
      dark: "#000000", // black
    },
    background: {
      default: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Open Sans, sans-serif",
    subtitle1: {
      fontSize: 12,
    },
    body1: {
      color: "#000000",
    },
    body2: {
      fontSize: 16,
      color: "#009A4A",
    },
    h1: {
      fontWeight: "550",
      fontSize: 28,
      color: "#009A4A",
    },
    h2: {
      fontWeight: "550",
      fontSize: 20,
      color: "#009A4A",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          zoom: 1.1, // 110% app-wide
        },
      },
    },

    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            padding: "8px 4px",
            fontSize: "0.875rem",
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.sparkle-gold.MuiTableRow-root": {
            backgroundColor: "#ffeb99 !important",
          },
          "&.sparkle-silver.MuiTableRow-root": {
            backgroundColor: "#e0e0e0 !important",
          },
          "&.sparkle-bronze.MuiTableRow-root": {
            backgroundColor: "#d6a56f !important",
          },
        },
      },
    },
  },
});

export default theme;
