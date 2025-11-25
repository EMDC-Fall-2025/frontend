import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { api } from "../../lib/api";
import Modal from "./Modal";
import theme from "../../theme";

type Props = {
  open: boolean;
  onClose: () => void;
  userEmail?: string; // Optional: pre-fill email if provided
  userType?: string; // Optional: "Coach", "Organizer", etc. for display
};

/**
 * ResendPasswordEmailDialog Component
 * 
 * Modal dialog for admins to resend set-password emails to users.
 * Useful when the initial email wasn't sent or failed to send.
 * Features:
 * - Email input field (can be pre-filled)
 * - Connects to backend API: /api/auth/send-set-password/
 * - Requires admin authentication (enforced by backend)
 */
export default function ResendPasswordEmailDialog({ 
  open, 
  onClose, 
  userEmail = "",
  userType = "user"
}: Props) {
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Update email when userEmail prop changes or modal opens
  useEffect(() => {
    if (open && userEmail) {
      setEmail(userEmail);
    }
  }, [open, userEmail]);

  /**
   * Handles form submission to resend set-password email
   * Validates email format and sends request to backend API
   */
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // Validate email is provided
    if (!email || email.trim() === "") {
      setErr("Email is required.");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErr("Please enter a valid email address.");
      return;
    }
    
    try {
      setLoading(true);
      // Send request to backend API endpoint
      // Backend requires authentication (admin/organizer)
      const res = await api.post(
        `/api/auth/send-set-password/`,
        { username: email.trim() }
      );
      setOk(res.data?.detail || "Set-password email sent successfully.");
      // Auto-close modal after successful send (2 second delay)
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to send set-password email.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErr(null);
    setOk(null);
    setEmail(userEmail); // Reset to initial value
    onClose();
  };

  return (
    <Modal open={open} handleClose={handleClose} title={`Resend Password Email${userType !== "user" ? ` to ${userType}` : ""}`}>
      <form
        onSubmit={handleResend}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, textAlign: "center", maxWidth: 400 }}
        >
          Enter the email address of the {userType.toLowerCase()} to send a set-password link.
          They will receive an email with instructions to set their password.
        </Typography>

        <TextField
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          sx={{ mt: 1, width: 300 }}
          required
          disabled={loading}
          autoFocus
        />

        {err && (
          <Alert severity="error" sx={{ mt: 2, width: 300 }}>
            {err}
          </Alert>
        )}
        {ok && (
          <Alert severity="success" sx={{ mt: 2, width: 300 }}>
            {ok}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 4, width: 300, justifyContent: "center" }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              width: 120,
              height: 44,
              bgcolor: theme.palette.grey[200],
              color: theme.palette.text.primary,
              textTransform: "none",
              borderRadius: "12px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: theme.palette.grey[300],
                transform: "translateY(-2px)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            sx={{
              width: 120,
              height: 44,
              bgcolor: theme.palette.success.main,
              color: "#fff",
              textTransform: "none",
              borderRadius: "12px",
              boxShadow: `
                0 4px 12px rgba(76, 175, 80, 0.3),
                0 2px 4px rgba(76, 175, 80, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: theme.palette.success.dark,
                transform: "translateY(-2px)",
                boxShadow: `
                  0 6px 16px rgba(76, 175, 80, 0.4),
                  0 4px 8px rgba(76, 175, 80, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
              },
              "&:active": {
                transform: "translateY(0px)",
                boxShadow: `
                  0 2px 8px rgba(76, 175, 80, 0.3),
                  inset 0 2px 4px rgba(0, 0, 0, 0.1)
                `,
              },
              "&:disabled": {
                bgcolor: theme.palette.grey[400],
                color: theme.palette.grey[600],
              },
            }}
          >
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </Box>
      </form>
    </Modal>
  );
}

