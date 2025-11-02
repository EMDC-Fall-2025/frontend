import {
  Button,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  FormHelperText,
  Box,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
import { useEffect, useMemo, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import theme from "../theme";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SetPassword() {
  const q = useQuery();
  const navigate = useNavigate();

  const uid = q.get("uid") || "";
  const token = q.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const minLenOk = password.length >= 8;
  const matchOk = password === confirm;

  // Optional: validate token when page opens
  useEffect(() => {
    if (!uid || !token) {
      toast.error("Missing link information. Please request a new email.");
      navigate("/forgot-password");
      return;
    }
    (async () => {
      try {
        await axios.post("/api/auth/password-token/validate/", { uid, token });
      } catch {
        toast.error("Link invalid or expired. Please request a new email.");
        navigate("/forgot-password");
      }
    })();
  }, [uid, token, navigate]);

  const handleClickShowPassword = () => setShowPassword((v) => !v);
  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();
  const handleMouseUpPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minLenOk) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!matchOk) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setSubmitting(true);
      await axios.post("/api/auth/password/complete/", {
        uid,
        token,
        password,
      });
      toast.success("Password set. You can log in now.");
      navigate("/login");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ??
        err?.response?.data?.password?.[0] ??
        "Link invalid or expired. Please request a new email."
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          p: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h1">Set Password</Typography>

        <Box component="form" onSubmit={onSubmit} sx={{ mt: 2, width: "100%" }}>
          <FormControl required sx={{ mt: 2, width: 300 }} variant="outlined">
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
            <FormHelperText error={!minLenOk}>
              {minLenOk ? "Minimum length satisfied." : "Minimum 8 characters required."}
            </FormHelperText>
          </FormControl>

          <FormControl required sx={{ mt: 2, width: 300 }} variant="outlined">
            <InputLabel>Confirm Password</InputLabel>
            <OutlinedInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type={showPassword ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                    aria-label="toggle confirm password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Confirm Password"
            />
            <FormHelperText error={!matchOk}>
              {matchOk ? "Passwords match." : "Passwords do not match."}
            </FormHelperText>
          </FormControl>

          <Button
            type="submit"
            disabled={submitting || !minLenOk || !matchOk}
            sx={{
              width: 140,
              height: 40,
              bgcolor: `${theme.palette.primary.main}`,
              color: `${theme.palette.secondary.main}`,
              mt: 3,
              "&:disabled": { opacity: 0.6 },
            }}
          >
            {submitting ? "Saving..." : "Save Password"}
          </Button>
        </Box>
      </Container>
    </>
  );
}
