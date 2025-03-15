import { useEffect, useState } from "react";
import logo from "../assets/EMDC_Fullcolor.png";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { Button } from "@mui/material";
import AreYouSureModal from "./Modals/AreYouSureModal";

export default function Nav() {
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const { isAuthenticated, role, logout, authError } = useAuthStore();
  const [logoUrl, setLogoUrl] = useState("");
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
          break;
      }
    } else {
      setLogoUrl("/");
    }
  }, [isAuthenticated, role, navigate]);

  const isHomePage = location.pathname === "/";

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ background: "#ffffff" }}>
          <Toolbar>
            <Box component={Link} to={logoUrl}>
              <img src={logo} style={{ width: "8rem" }} alt="Logo" />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", ml: "auto", gap: 2 }}>
              {isHomePage && (
                <Button
                  variant="contained"
                  onClick={() => navigate("/contestPage")}
                  sx={{ 
                    minWidth: { xs: 'auto', sm: '120px' }, 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                    whiteSpace: 'nowrap', 
                    px: { xs: 1, sm: 2 },
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
                    minWidth: { xs: '80px', sm: '120px' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    whiteSpace: 'nowrap', 
                  }}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => navigate("/login/")}
                  sx={{ 
                    minWidth: { xs: '80px', sm: '120px' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      </Box>
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to logout?"
        handleSubmit={() => handleLogout()}
        error={authError}
      />
    </>
  );
}