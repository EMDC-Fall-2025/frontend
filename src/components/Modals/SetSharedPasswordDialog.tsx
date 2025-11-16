import { useState } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Alert,
  Box,
} from "@mui/material";
import { api } from "../../lib/api";
import Modal from "./Modal";
import theme from "../../theme";

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!password || password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post(
        `/api/auth/set-shared-password/`,
        { role, password }
      );
      setOk(res.data?.message || "Shared password set successfully.");
      setPassword("");
      setConfirm("");
      // Auto-close after success
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
          onChange={(e) => setPassword(e.target.value)}
          helperText="Minimum 8 characters"
          variant="outlined"
          sx={{ mt: 3, width: 300 }}
          required
        />

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
