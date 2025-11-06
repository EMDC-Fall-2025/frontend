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
} from "@mui/material";
import axios from "axios";

type Props = {
  open: boolean;
  onClose: () => void;
  token: string | null;
};

export default function SetSharedPasswordDialog({ open, onClose, token }: Props) {
  const [role, setRole] = useState<2 | 3>(2); // 2=Organizer, 3=Judge
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleSave = async () => {
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
    if (!token) {
      setErr("Missing auth token.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `/api/auth/set-shared-password/`,
        { role, password },
        { headers: { Authorization: `Token ${token}` } }
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
            onChange={(e) => setPassword(e.target.value)}
            helperText="Minimum 8 characters"
          />

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
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
