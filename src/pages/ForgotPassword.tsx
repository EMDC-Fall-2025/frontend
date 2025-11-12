import {
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
import { useState } from "react";
import theme from "../theme";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `/api/auth/forgot-password/`,
        { username: email },
        { withCredentials: true }
      );

      // Check if there's an error in the response (non-admin user)
      if (response.data?.error) {
        // Show error toast for non-admin users
        toast.error(
          "Password reset is only available for administrators. Please contact an administrator for assistance.",
          {
            duration: 6000,
            style: {
              maxWidth: "500px",
            },
          }
        );
        setError(response.data.detail || response.data.error);
      } else {
        // Success - admin email sent
        toast.success(
          "If this email belongs to an admin, a password reset link has been sent.",
          {
            duration: 5000,
          }
        );
        // Clear form
        setEmail("");
        // Optionally navigate back to login after a delay
        setTimeout(() => {
          navigate("/login/");
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send password reset email. Please try again.";

      if (err?.response?.status === 403) {
        // Non-admin user - show toast
        toast.error(
          "Password reset is only available for administrators. Please contact an administrator for assistance.",
          {
            duration: 6000,
            style: {
              maxWidth: "500px",
            },
          }
        );
      } else {
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TriangleBackground />
      <Button
        variant="contained"
        onClick={() => navigate("/login/")}
        sx={{ m: 1 }}
      >
        Back To Login
      </Button>
      <Container
        maxWidth="xs"
        sx={{
          height: "auto",
          bgcolor: "#ffffff",
          borderRadius: 5,
          mt: 15,
          boxShadow: 5,
          padding: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h1">Forgot Password</Typography>
        <Typography
          variant="body2"
          sx={{ mt: 2, mb: 1, color: "text.secondary", textAlign: "center" }}
        >
          Enter your email address to receive a password reset link.
          <br />
          <strong>Note: Password reset is only available for administrators.</strong>
        </Typography>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TextField
            required
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ mt: 3, width: 300 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: 300 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || !email}
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
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </Container>
    </>
  );
}

