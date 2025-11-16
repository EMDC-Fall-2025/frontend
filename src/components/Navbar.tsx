import { useEffect, useState, memo } from "react";
import logo from "../assets/EMDC_Fullcolor.png";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import {
  Button,
  Container,
  Paper,
  Tooltip,
  Chip,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";

import AreYouSureModal from "./Modals/AreYouSureModal";
import SetSharedPasswordDialog from "./Modals/SetSharedPasswordDialog";
import theme from "../theme";
import KeyIcon from "@mui/icons-material/Key";

function Nav() {
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [openSetShared, setOpenSetShared] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const { isAuthenticated, role, logout } = useAuthStore();
  const [logoUrl, setLogoUrl] = useState("/");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      logout();
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role) {
      switch (role.user_type) {
        case 1:
          setLogoUrl("/admin/");
          break;
        case 2:
          setLogoUrl("/organizer/");
          break;
        case 3:
          setLogoUrl(`/judging/${role.user.id}`);
          break;
        case 4:
          setLogoUrl("/coach/");
          break;
        default:
          setLogoUrl("/");
      }
    } else {
      setLogoUrl("/");
    }
  }, [isAuthenticated, role, navigate]);

  const isHomePage = location.pathname === "/";
  const isAdmin = role?.user_type === 1;

  const roleLabel = (t?: number) =>
    t === 1
      ? "Admin"
      : t === 2
      ? "Organizer"
      : t === 3
      ? "Judge"
      : t === 4
      ? "Coach"
      : "User";

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: "transparent",
            boxShadow: "none",
            zIndex: (t) => t.zIndex.drawer + 2,
          }}
        >
          <Container
            maxWidth={isHomePage ? false : "lg"}
            disableGutters={isHomePage}
            sx={{ py: 1, px: { xs: 1, sm: 2 } }}
          >
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                overflow: "visible",
                px: { xs: 1.5, md: 2.5 },
                py: { xs: 1, md: 1.25 },
                borderRadius: 2,
                backgroundColor: "#fff",
                border: `1px solid ${theme.palette.grey[200]}`,
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.06)",
              }}
            >
              <Toolbar
                disableGutters
                sx={{
                  minHeight: { xs: 56, sm: 64 },
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                }}
              >
                {/* Logo */}
                <Box
                  component={Link}
                  to={logoUrl}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{ width: { xs: "6rem", sm: "7.5rem", md: "8.5rem" } }}
                  />
                </Box>

                {/* Right Actions */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    ml: "auto",
                    gap: { xs: 1, sm: 2 },
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    justifyContent: { xs: "flex-end", sm: "flex-start" },
                  }}
                >
                  {isHomePage && (
                    <Button
                      variant="contained"
                      onClick={() => navigate("/contestPage")}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: { xs: 1.5, sm: 2.5 },
                        minWidth: { xs: "auto", sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
                        order: { xs: 2, sm: 0 },
                      }}
                    >
                      Contest Results
                    </Button>
                  )}

                  {/* User Chip */}
                  {isAuthenticated && (
                    <Chip
                      label={`${roleLabel(role?.user_type)} • ${
                        role?.user?.first_name ?? ""
                      }${
                        role?.user?.last_name ? " " + role?.user?.last_name : ""
                      }`}
                      variant="outlined"
                      sx={{ mr: { xs: 0, sm: 1 } }}
                    />
                  )}

                  {/* Admin-only: Set Role Password */}
                  {isAuthenticated && isAdmin && (
                    <Tooltip title="Set shared password for Judges/Organizers">
                      <Button
                        variant="outlined"
                        onClick={() => setOpenSetShared(true)}
                        startIcon={<KeyIcon />}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: { xs: 1.5, sm: 2.5 },
                          minWidth: { xs: 80, sm: 160 },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          whiteSpace: "nowrap",
                          order: { xs: 1, sm: 0 },
                        }}
                      >
                        Set Role Password
                      </Button>
                    </Tooltip>
                  )}

                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      onClick={() => setOpenAreYouSure(true)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: { xs: 1.5, sm: 2.5 },
                        minWidth: { xs: 80, sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
                        order: { xs: 1, sm: 0 },
                      }}
                    >
                      Logout
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => navigate("/login/")}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: { xs: 1.5, sm: 2.5 },
                        minWidth: { xs: 80, sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
                        order: { xs: 1, sm: 0 },
                      }}
                    >
                      Login
                    </Button>
                  )}
                </Box>
              </Toolbar>
            </Paper>
          </Container>
        </AppBar>
      </Box>

      {/* Logout Modal */}
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to logout?"
        handleSubmit={handleLogout}
      />

      {/* Admin: Set Shared Password */}
      <SetSharedPasswordDialog
        open={openSetShared}
        onClose={() => setOpenSetShared(false)}
      />

      {/* Snackbar (kept, but no shortcut triggers it now) */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2200}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="info"
          onClose={() => setSnackOpen(false)}
        >
          Shared password updated successfully
        </MuiAlert>
      </Snackbar>
    </>
  );
}

export default memo(Nav);
