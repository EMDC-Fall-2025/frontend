import { useState } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { api } from "../../lib/api";
import Modal from "./Modal";
import theme from "../../theme";

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

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * SetSharedPasswordDialog Component
 * 
 * Modal dialog for admins to set/update shared passwords for Organizers (role 2) or Judges (role 3).
 * Features:
 * - Real-time password validation with visual feedback
 * - Password requirements checklist
 * - Role selection (Organizer/Judge)
 * - Connects to backend API: /api/auth/set-shared-password/
 */
export default function SetSharedPasswordDialog({ open, onClose }: Props) {
  const [role, setRole] = useState<2 | 3>(2); // 2=Organizer, 3=Judge
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Helper variables for password requirements checklist (used in JSX)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

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
   * Handles form submission to set shared password
   * Validates password requirements and sends request to backend API
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // Validate password meets all requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErr("Please fix password requirements below.");
      return;
    }
    
    // Ensure passwords match
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    
    try {
      setLoading(true);
      // Send request to backend API endpoint
      const res = await api.post(
        `/api/auth/set-shared-password/`,
        { role, password }
      );
      setOk(res.data?.message || "Shared password set successfully.");
      setPassword("");
      setConfirm("");
      setPasswordErrors([]);
      // Auto-close modal after successful save (1.5 second delay)
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to set shared password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErr(null);
    setOk(null);
    setPassword("");
    setConfirm("");
    setPasswordErrors([]);
    onClose();
  };

  return (
    <Modal open={open} handleClose={handleClose} title="Set Shared Password">
      <form
        onSubmit={handleSave}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TextField
          select
          label="Role"
          value={role}
          onChange={(e) => setRole(Number(e.target.value) as 2 | 3)}
          variant="outlined"
          sx={{ mt: 1, width: 300 }}
          required
        >
          <MenuItem value={2}>Organizer</MenuItem>
          <MenuItem value={3}>Judge</MenuItem>
        </TextField>

        <TextField
          type="password"
          label="New shared password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          error={passwordErrors.length > 0 && password.length > 0}
          helperText={password.length > 0 ? undefined : "Minimum 8 characters"}
          variant="outlined"
          sx={{ mt: 3, width: 300 }}
          required
        />

        {password.length > 0 && (
          <Box sx={{ mt: 1.5, mb: 1, width: 300 }}>
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

        <TextField
          type="password"
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          variant="outlined"
          sx={{ mt: 3, width: 300 }}
          required
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
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </form>
    </Modal>
  );
}
