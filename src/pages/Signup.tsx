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
  } from "@mui/material";
  import TriangleBackground from "../components/TriangleBackground";
  import { useState } from "react";
  import { Visibility, VisibilityOff } from "@mui/icons-material";
  import theme from "../theme";
  import { useNavigate } from "react-router";
  import { useSignupStore } from "../store/primary_stores/signupStore";
  
  export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
    const navigate = useNavigate();
    const { signup, isLoadingSignup, authError } = useSignupStore();
  
    const handleSignup = async () => {
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
                onChange={(e) => setPassword(e.target.value)}
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
  