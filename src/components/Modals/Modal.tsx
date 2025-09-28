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
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={handleClose}
      sx={{ textAlign: "center" }}
    >
      <Box sx={{ position: "relative", padding: "16px" }}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: "8px",
            top: "8px",
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle
          sx={{
            margin: 0,
            textAlign: "center",
            padding: "0 48px",
          }}
        >
          {title}
        </DialogTitle>
      </Box>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
