import { useEffect, useState } from "react";
import logo from "../assets/EMDC_Fullcolor.png";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { Button, Container, Paper } from "@mui/material";

import AreYouSureModal from "./Modals/AreYouSureModal";
import theme from "../theme";

export default function Nav() {
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const { isAuthenticated, role, logout, authError } = useAuthStore();
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

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        {/* Sticky keeps it in flow (no overlap), high zIndex stays on top */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: "transparent",
            boxShadow: "none",
            zIndex: (t) => t.zIndex.drawer + 2,
          }}
        >
          <Container maxWidth="lg" sx={{ py: 1 }}>
            {/* Boxy white bar with soft shadow that reads on white backgrounds */}
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
              <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 } }}>
                {/* Logo (left) */}
                <Box
                  component={Link}
                  to={logoUrl}
                  sx={{ display: "inline-flex", alignItems: "center" }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{ width: { xs: "7.5rem", sm: "8.5rem" } }}
                  />
                </Box>

                {/* Right actions */}
                <Box sx={{ display: "flex", alignItems: "center", ml: "auto", gap: 2 }}>
                  {isHomePage && (
                    <Button
                      variant="contained"
                      onClick={() => navigate("/contestPage")}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 2.5,
                        minWidth: { xs: "auto", sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
                      }}
                    >
                      Contest Results
                    </Button>
                  )}

                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      onClick={() => setOpenAreYouSure(true)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 2.5,
                        minWidth: { xs: 80, sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
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
                        px: 2.5,
                        minWidth: { xs: 80, sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
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

      {/* Logout confirmation (unchanged) */}
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to logout?"
        handleSubmit={handleLogout}
        error={authError}
      />
    </>
  );
}