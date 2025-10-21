/**
 * AreYouSureModal Component
 * 
 * Confirmation modal with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import { Button, Container } from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";

export interface IAreYouSureModalProps {
  open: boolean;
  handleClose: () => void;
  title: string;
  handleSubmit: () => void;
}

export default function AreYouSureModal(props: IAreYouSureModalProps) {
  const { handleClose, handleSubmit, open, title } = props;

  const handleSubmitModal = () => {
    handleSubmit();
    handleClose();
  };

  return (
    <Modal open={open} handleClose={handleClose} title={title}>
      <Container
        sx={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          gap: 2,
        }}
      >
        {/* Yes button - updated to use modern green success theme */}
        <Button
          onClick={handleSubmitModal}
          sx={{
            width: 90,
            height: 44,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            mt: 2,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Yes
        </Button>
        {/* No button - updated to use modern grey theme for cancel action */}
        <Button
          onClick={handleClose}
          sx={{
            width: 90,
            height: 44,
            bgcolor: theme.palette.grey[500],
            "&:hover": { bgcolor: theme.palette.grey[600] },
            color: "#fff",
            mt: 2,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          No
        </Button>
      </Container>
    </Modal>
  );
}
