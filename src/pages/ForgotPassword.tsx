import { useState } from "react";
import {
  Button,
  Container,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
import theme from "../theme";
import axios from "axios";
import toast from "react-hot-toast";

function isEmail(v: string) {
  return /\S+@\S+\.\S+/.test(v);
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    try {
      setSubmitting(true);
      // Backend endpoint that sends the set/reset link (console email in dev)
      await axios.post(`/api/auth/request-password-set/`, { email });
      toast.success("If that email exists, a link was sent. (Check terminal in dev)");
    } catch {
      // avoid user enumeration: show generic success
      toast.success("If that email exists, a link was sent. (Check terminal in dev)");
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
        <Typography variant="h1">Forgot Password</Typography>

        <Box component="form" onSubmit={onSubmit} sx={{ mt: 4, width: "100%" }}>
          <TextField
            required
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            sx={{ width: 300 }}
          />

          <Button
            type="submit"
            disabled={submitting || !isEmail(email)}
            sx={{
              width: 140,
              height: 40,
              bgcolor: `${theme.palette.primary.main}`,
              color: `${theme.palette.secondary.main}`,
              mt: 3,
              "&:disabled": { opacity: 0.6 },
            }}
          >
            {submitting ? "Sending..." : "Send Email"}
          </Button>
        </Box>
      </Container>
    </>
  );
}
