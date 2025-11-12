import {
  Button,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
import { useState, useEffect } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import theme from "../theme";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// Password validation helper
const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (pwd.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(pwd)) {
    errors.push("One uppercase letter");
  }
  if (!/[a-z]/.test(pwd)) {
    errors.push("One lowercase letter");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) {
    errors.push("One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");
  }
  return { valid: errors.length === 0, errors };
};

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Validate token when page loads
  useEffect(() => {
    if (!uid || !token) {
      setError("Invalid link. Missing required parameters.");
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await axios.post(
          `/api/auth/password-token/validate/`,
          { uid, token },
          { withCredentials: true }
        );
        
        if (response.status === 200) {
          setTokenValid(true);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Invalid or expired link.");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [uid, token]);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (newPassword.length > 0) {
      const validation = validatePassword(newPassword);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError("Please fix password requirements above.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!uid || !token) {
      setError("Invalid link. Please request a new password reset link.");
      return;
    }

    try {
      setLoading(true);
      
      // Get CSRF token
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      let csrftoken = getCookie('csrftoken');
      if (!csrftoken) {
        await axios.get(`/api/auth/csrf/`, { withCredentials: true });
        csrftoken = getCookie('csrftoken');
      }

      const response = await axios.post(
        `/api/auth/password/complete/`,
        { uid, token, password },
        {
          withCredentials: true,
          headers: csrftoken ? { 'X-CSRFToken': csrftoken } : {}
        }
      );

      toast.success("Password set successfully! You can now log in.", {
        duration: 5000,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login/");
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.password?.[0] ||
        err?.message ||
        "Failed to set password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <>
        <TriangleBackground />
        <Container
          maxWidth="xs"
          sx={{
            height: "auto",
            bgcolor: "#ffffff",
            borderRadius: 5,
            mt: 20,
            boxShadow: 5,
            padding: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CircularProgress sx={{ mt: 5 }} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Validating link...
          </Typography>
        </Container>
      </>
    );
  }

  if (!tokenValid) {
    return (
      <>
        <TriangleBackground />
        <Container
          maxWidth="xs"
          sx={{
            height: "auto",
            bgcolor: "#ffffff",
            borderRadius: 5,
            mt: 20,
            boxShadow: 5,
            padding: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h1">Set Password</Typography>
          <Alert severity="error" sx={{ mt: 3, width: 300 }}>
            {error || "Invalid or expired link. Please request a new password reset link."}
          </Alert>
          <Button
            onClick={() => navigate("/forgot-password/")}
            sx={{
              width: 200,
              height: 35,
              bgcolor: `${theme.palette.primary.main}`,
              color: `${theme.palette.secondary.main}`,
              mt: 3,
            }}
          >
            Request New Link
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <TriangleBackground />
      <Container
        maxWidth="xs"
        sx={{
          height: "auto",
          bgcolor: "#ffffff",
          borderRadius: 5,
          mt: 20,
          boxShadow: 5,
          padding: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h1">Set Password</Typography>
        {email && (
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            Setting password for: {email}
          </Typography>
        )}
        
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <FormControl
            required
            sx={{ mt: 3, width: 300 }}
            variant="outlined"
          >
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading}
              error={passwordErrors.length > 0 && password.length > 0}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>
          {password.length > 0 && (
            <Box sx={{ mt: 1, width: 300 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                Password must contain:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: "0.75rem" }}>
                <li style={{ color: password.length >= 8 ? "green" : passwordErrors.includes("At least 8 characters") ? "red" : "gray" }}>
                  At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(password) ? "green" : passwordErrors.includes("One uppercase letter") ? "red" : "gray" }}>
                  One uppercase letter
                </li>
                <li style={{ color: /[a-z]/.test(password) ? "green" : passwordErrors.includes("One lowercase letter") ? "red" : "gray" }}>
                  One lowercase letter
                </li>
                <li style={{ color: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? "green" : passwordErrors.includes("One special character") ? "red" : "gray" }}>
                  One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
                </li>
              </Box>
            </Box>
          )}
          
          <FormControl
            required
            sx={{ mt: 3, width: 300 }}
            variant="outlined"
          >
            <InputLabel>Confirm Password</InputLabel>
            <OutlinedInput
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Confirm Password"
            />
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: 300 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            sx={{
              width: 150,
              height: 40,
              bgcolor: `${theme.palette.primary.main}`,
              color: `${theme.palette.secondary.main}`,
              mt: 4,
              "&:disabled": {
                bgcolor: theme.palette.grey[300],
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Setting...
              </>
            ) : (
              "Set Password"
            )}
          </Button>
        </form>
      </Container>
    </>
  );
}
