import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
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
      sx={{ textAlign: "center" }}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ 
        position: "relative", 
        padding: { xs: "12px", sm: "16px" } 
      }}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: { xs: "4px", sm: "8px" },
            top: { xs: "4px", sm: "8px" },
            color: theme.palette.grey[500],
            fontSize: { xs: "1.2rem", sm: "1.5rem" },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle
          sx={{
            margin: 0,
            textAlign: "center",
            padding: { xs: "0 32px", sm: "0 48px" },
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
            fontWeight: 600,
          }}
        >
          {title}
        </DialogTitle>
      </Box>
      <DialogContent
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          padding: { xs: "16px", sm: "24px" },
          "&.MuiDialogContent-root": {
            paddingTop: { xs: "8px", sm: "16px" },
          }
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
