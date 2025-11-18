import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Paper,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode } from "react";

export interface IModalProps {
  open: boolean;
  handleClose: () => void;
  title: String;
  children?: ReactNode;
}

export default function Modal(props: IModalProps) {
  const { open, handleClose, title, children } = props;
  const theme = useTheme();
  
  // Use full screen on mobile devices
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={handleClose}
      sx={{ 
        textAlign: "center",
        "& .MuiDialog-paper": {
          borderRadius: { xs: "16px", sm: "24px" },
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(76, 175, 80, 0.08),
            0 0 0 1px rgba(76, 175, 80, 0.05)
          `,
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
        }
      }}
      maxWidth="sm"
      fullWidth
      PaperComponent={Paper}
      TransitionProps={{
        timeout: 300,
      }}
    >
      <Box 
        sx={{ 
          position: "relative", 
          padding: { xs: "20px 16px", sm: "24px 20px" },
          background: "linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(76, 175, 80, 0.01) 100%)",
          borderBottom: "1px solid rgba(76, 175, 80, 0.1)",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: { xs: "8px", sm: "12px" },
            top: { xs: "8px", sm: "12px" },
            color: theme.palette.grey[600],
            fontSize: { xs: "1.2rem", sm: "1.5rem" },
            transition: "all 0.2s ease",
            "&:hover": {
              color: theme.palette.success.main,
              transform: "rotate(90deg)",
              backgroundColor: "rgba(76, 175, 80, 0.08)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle
          component="div"
          sx={{
            margin: 0,
            textAlign: "center",
            padding: { xs: "0 40px", sm: "0 48px" },
            paddingTop: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"DM Serif Display", "Georgia", serif',
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 400,
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              color: theme.palette.success.dark,
              textShadow: "0 2px 8px rgba(76, 175, 80, 0.2)",
            }}
          >
            {title}
          </Typography>
        </DialogTitle>
      </Box>
      <DialogContent
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          padding: { xs: "20px 16px", sm: "28px 24px" },
          "&.MuiDialogContent-root": {
            paddingTop: { xs: "16px", sm: "20px" },
          }
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
