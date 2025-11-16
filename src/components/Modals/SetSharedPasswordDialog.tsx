import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import axios from "axios";

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

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SetSharedPasswordDialog({ open, onClose }: Props) {
  const [role, setRole] = useState<2 | 3>(2); // 2=Organizer, 3=Judge
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // helpers for JSX
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

  const handleSave = async () => {
    setErr(null);
    setOk(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErr("Please fix password requirements below.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      // Backend uses SessionAuthentication, so cookies are sent automatically
      // No Authorization header needed - axios will include session cookies
      const res = await axios.post(
        `/api/auth/set-shared-password/`,
        { role, password },
        { withCredentials: true } // Ensure cookies are sent
      );
      setOk(res.data?.message || "Shared password set successfully.");
      setPassword("");
      setConfirm("");
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Set Shared Password</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(Number(e.target.value) as 2 | 3)}
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
            helperText={
              password.length > 0 ? undefined : "Minimum 8 characters"
            }
          />

          {password.length > 0 && (
            <Box sx={{ mt: -1, mb: 1 }}>
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
                  {
                    "One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
                  }
                </li>
              </Box>
            </Box>
          )}

          <TextField
            type="password"
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {err && <Alert severity="error">{err}</Alert>}
          {ok && <Alert severity="success">{ok}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
