import {
  Button,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import TriangleBackground from "../components/TriangleBackground";
//import { useState } from "react";
import theme from "../theme";


export default function ForgotPassword() {
  //TODO:
  //const [email, setEmail] = useState("");
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
        <Typography variant="h1">Forgot Password</Typography>
        <TextField
          required
          label="Email"
          variant="outlined"
          //TODO: Uncomment when auth is complete
          // onChange={(e: any) => setEmail(e.target.value)}
          sx={{ mt: 5, width: 300 }}
        />
      
        
        <Button
          href="/set-password"
          sx={{
            width: 110,
            height: 35,
            bgcolor: `${theme.palette.primary.main}`,
            color: `${theme.palette.secondary.main}`,
            mt: 5,
          }}
        >
          Send Email
        </Button>
      </Container>
    </>
  );
  

}

