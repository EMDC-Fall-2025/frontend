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
          <Container maxWidth={isHomePage ? false : "lg"} disableGutters={isHomePage} sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
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
              <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 }, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                {/* Logo (left) */}
                <Box
                  component={Link}
                  to={logoUrl}
                  sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{ width: { xs: "6rem", sm: "7.5rem", md: "8.5rem" } }}
                  />
                </Box>

                {/* Right actions */}
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  ml: "auto", 
                  gap: { xs: 1, sm: 2 },
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                  justifyContent: { xs: "flex-end", sm: "flex-start" }
                }}>
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
                        order: { xs: 2, sm: 0 }
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
                        px: { xs: 1.5, sm: 2.5 },
                        minWidth: { xs: 80, sm: 120 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        bgcolor: theme.palette.success.main,
                        "&:hover": { bgcolor: theme.palette.success.dark },
                        order: { xs: 1, sm: 0 }
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
                        order: { xs: 1, sm: 0 }
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

      {/* Logout confirmation*/}
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to logout?"
        handleSubmit={handleLogout}
      />
    </>
  );
}