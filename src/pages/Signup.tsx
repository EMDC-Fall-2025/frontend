import {
  Button,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import theme from "../theme";
import { useNavigate } from "react-router";
import { useSignupStore } from "../store/primary_stores/signupStore";

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
 * Signup Component
 * 
 * Page for new users to create an account.
 * Features:
 * - Real-time password validation with visual feedback
 * - Password requirements checklist
 * - Email and password validation
 * - Connects to backend API: /api/signup/ (via useSignupStore)
 */
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const navigate = useNavigate();
  const { signup, isLoadingSignup, authError } = useSignupStore();

  /**
   * Handles password input changes and validates in real-time
   */
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
   * Handles form submission to create new user account
   * Validates password requirements before submitting
   */
  const handleSignup = async () => {
    setConfirmPasswordError("");

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setConfirmPasswordError("Please fix password requirements above");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    try {
      await signup(email, password);
      navigate("/login/"); // Redirect after successful signup
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  // Helper variables for password requirements checklist (used in JSX for color coding)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  return (
    <>
      <TriangleBackground />
      <Button variant="contained" onClick={() => navigate("/")} sx={{ m: 1 }}>
        Back To Home
      </Button>
      <Button
        variant="contained"
        onClick={() => navigate("/login/")}
        sx={{ position: "absolute", top: 16, right: 16 }}
      >
        Login
      </Button>
      <Container
        maxWidth="xs"
        sx={{
          height: "auto",
          bgcolor: "#ffffff",
          borderRadius: 5,
          mt: 5,
          boxShadow: 5,
          padding: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h1">Sign Up</Typography>
        <form
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TextField
            required
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mt: 5, width: 300 }}
          />
          <FormControl required sx={{ mt: 3, width: 300 }} variant="outlined">
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={passwordErrors.length > 0 && password.length > 0}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
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
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Confirm Password"
            />
          </FormControl>
          {confirmPasswordError && (
            <Alert sx={{ mt: 1, width: 300 }} severity="error">
              {confirmPasswordError}
            </Alert>
          )}
          {authError && (
            <Alert sx={{ mt: 1, width: 300 }} severity="warning">
              {authError}
            </Alert>
          )}
          <Button
            onClick={handleSignup}
            disabled={isLoadingSignup}
            sx={{
              width: 120,
              height: 35,
              bgcolor: `${theme.palette.primary.main}`,
              color: `${theme.palette.secondary.main}`,
              mt: 5,
            }}
          >
            {isLoadingSignup ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
      </Container>
    </>
  );
}
