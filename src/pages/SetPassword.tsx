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
import { api } from "../lib/api";
import toast from "react-hot-toast";

/**
 * Password validation helper function
 * Validates password against requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
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

/**
 * SetPassword Component
 * 
 * Page for users to set/reset their password using a token from email link.
 * Features:
 * - Token validation on page load
 * - Real-time password validation with visual feedback
 * - Password requirements checklist
 * - Connects to backend APIs:
 *   - /api/auth/password-token/validate/ (validate token)
 *   - /api/auth/password/complete/ (complete password reset)
 */
export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract URL parameters from email link
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

  /**
   * Validates password reset token when page loads
   * Checks if token from email link is valid before showing password form
   */
  useEffect(() => {
    if (!uid || !token) {
      setError("Invalid link. Missing required parameters.");
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        // Validate token with backend API
        const response = await api.post(`/api/auth/password-token/validate/`, {
          uid,
          token,
        });

        if (response.status === 200) {
          setTokenValid(true);
        }
      } catch (err: any) {
        // Token is invalid or expired
        setError(err?.response?.data?.detail || "Invalid or expired link.");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [uid, token]);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (newPassword.length > 0) {
      const validation = validatePassword(newPassword);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  /**
   * Handles form submission to complete password reset
   * Validates password and sends request to backend API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password meets all requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError("Please fix password requirements above.");
      return;
    }

    // Ensure passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Ensure token parameters are present
    if (!uid || !token) {
      setError("Invalid link. Please request a new password reset link.");
      return;
    }

    try {
      setLoading(true);
      // Send password reset completion request to backend API
      await api.post(`/api/auth/password/complete/`, {
        uid,
        token,
        password,
      });

      toast.success("Password set successfully! You can now log in.", {
        duration: 5000,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login/");
      }, 2000);
    } catch (err: any) {
      // Extract user-friendly error message from backend response
      let errorMessage = "Failed to set password. Please try again.";
      
      if (err?.response?.data) {
        // Backend returned structured error data - prioritize detail, password errors, then error field
        errorMessage = 
          err.response.data.detail || 
          err.response.data.password?.[0] || 
          err.response.data.error || 
          errorMessage;
      } else if (err?.response?.status === 500) {
        // Server error without detailed message
        errorMessage = "Server error occurred. Please try again or contact support.";
      } else if (err?.message && !err.message.includes("status code")) {
        // Only use err.message if it's not the generic axios error message
        errorMessage = err.message;
      }
      
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
            {error ||
              "Invalid or expired link. Please request a new password reset link."}
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

  // Helper variables for password requirements checklist (used in JSX)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

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
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "text.secondary" }}
          >
            Setting password for: {email}
          </Typography>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <FormControl required sx={{ mt: 3, width: 300 }} variant="outlined">
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading}
              error={passwordErrors.length > 0 && password.length > 0}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>
          {password.length > 0 && (
            <Box sx={{ mt: 1, width: 300 }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
              >
                Password must contain:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: "0.75rem" }}>
                <li
                  style={{
                    color: hasMinLength
                      ? "green"
                      : passwordErrors.includes("At least 8 characters")
                      ? "red"
                      : "gray",
                  }}
                >
                  At least 8 characters
                </li>
                <li
                  style={{
                    color: hasUppercase
                      ? "green"
                      : passwordErrors.includes("One uppercase letter")
                      ? "red"
                      : "gray",
                  }}
                >
                  One uppercase letter
                </li>
                <li
                  style={{
                    color: hasLowercase
                      ? "green"
                      : passwordErrors.includes("One lowercase letter")
                      ? "red"
                      : "gray",
                  }}
                >
                  One lowercase letter
                </li>
                <li
                  style={{
                    color: hasSpecialChar
                      ? "green"
                      : passwordErrors.includes(
                          "One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
                        )
                      ? "red"
                      : "gray",
                  }}
                >
                  {"One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"}
                </li>
              </Box>
            </Box>
          )}

          <FormControl required sx={{ mt: 3, width: 300 }} variant="outlined">
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
