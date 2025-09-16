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
  error: string | null;
}

export default function AreYouSureModal(props: IAreYouSureModalProps) {
  const { handleClose, handleSubmit, open, title, error } = props;

  const handleSubmitModal = () => {
    handleSubmit();
    handleClose();
  };

  return (
    <Modal open={open} handleClose={handleClose} title={title} error={error}>
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
            height: 44,                                    // Consistent height (was 35)
            bgcolor: theme.palette.success.main,          // Green theme (was primary.main)
            "&:hover": { bgcolor: theme.palette.success.dark }, // Hover effect
            color: "#fff",                                // White text (was secondary.main)
            mt: 2,
            textTransform: "none",                        // No uppercase transformation
            borderRadius: 2,                              // Modern border radius
          }}
        >
          Yes
        </Button>
        {/* No button - updated to use modern grey theme for cancel action */}
        <Button
          onClick={handleClose}
          sx={{
            width: 90,
            height: 44,                                    // Consistent height (was 35)
            bgcolor: theme.palette.grey[500],             // Grey theme for cancel
            "&:hover": { bgcolor: theme.palette.grey[600] }, // Hover effect
            color: "#fff",                                // White text
            mt: 2,
            textTransform: "none",                        // No uppercase transformation
            borderRadius: 2,                              // Modern border radius
          }}
        >
          No
        </Button>
      </Container>
    </Modal>
  );
}
