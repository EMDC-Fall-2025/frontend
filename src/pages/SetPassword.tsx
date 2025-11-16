import {
  Button,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import theme from "../theme";

export default function SetPassword() {
  //TODO: Uncomment when auth is complete
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
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
          padding: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h1">Set Password</Typography>
        <FormControl
          required
          sx={{ mt: 3, width: 300 }}
          variant="outlined"
          //TODO: Uncomment when auth is complete
          // onChange={(e: any) => setPassword(e.target.value)}
        >
          <InputLabel>Password</InputLabel>
          <OutlinedInput
            type={showPassword ? "text" : "password"}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
          />
        </FormControl>
        <FormControl
          required
          sx={{ mt: 3, width: 300 }}
          variant="outlined"
          //TODO: Uncomment when auth is complete
          // onChange={(e: any) => setPassword(e.target.value)}
        >
          <InputLabel>Confirm Password</InputLabel>
          <OutlinedInput
            type={showPassword ? "text" : "password"}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Confirm Password"
          />
        </FormControl>
        
        <Button
          href="/"
          sx={{
            width: 90,
            height: 35,
            bgcolor: `${theme.palette.primary.main}`,
            color: `${theme.palette.secondary.main}`,
            mt: 5,
          }}
        >
          Login
        </Button>
      </Container>
    </>
  );
}
