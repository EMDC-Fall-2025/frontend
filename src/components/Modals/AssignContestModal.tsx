/**
 * AssignContestModal Component
 * 
 * Modal for assigning contests to organizers with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Contest } from "../../types";
import useContestStore from "../../store/primary_stores/contestStore";
import useMapContestOrganizerStore from "../../store/map_stores/mapContestToOrganizerStore";

export interface IAssignContestModalProps {
  organizerId: number;
  open: boolean;
  handleClose: () => void;
}

export default function OrganizerModal(props: IAssignContestModalProps) {
  const { handleClose, open, organizerId } = props;

  // Contest store for available contests
  const { allContests } = useContestStore();

  // Contest-organizer mapping store for assignments
  const {
    contestsByOrganizers,
    createContestOrganizerMapping,
  } = useMapContestOrganizerStore();

  const title = "Assign Contest To Organizer";
  const [contestId, setContestId] = useState(0);
  const [assignedContests, setAssignedContests] = useState<Contest[]>([]);

  // Load assigned contests when organizer changes
  useEffect(() => {
    if (contestsByOrganizers[organizerId]) {
      setAssignedContests(contestsByOrganizers[organizerId] || []);
    }
  }, [organizerId]);

  // Close modal and reset form
  const handleCloseModal = () => {
    handleClose();
    setContestId(0);
  };

  // Assign contest to organizer
  const handleAssignContest = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!contestId) {
      toast.error("Please select a contest before assigning.");
      return;
    }

    if (organizerId) {
      try {
        await createContestOrganizerMapping(organizerId, contestId);
        toast.success("Contest assigned to organizer successfully!");
        handleClose();
      } catch (error) {
        console.error("Failed to assign contest: ", error);
        toast.error("Failed to assign contest. Please try again.");
      }
    }
  };

  // Form submission handler
  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    handleAssignContest(e);
  };

  // Filter out already assigned contests
  const availableContests = allContests?.filter(
    (contest: Contest) =>
      !assignedContests.some((assigned) => assigned.id === contest.id)
  );

  return (
    <Modal
      open={open}
      handleClose={handleCloseModal}
      title={title}
    >
      <form
        onSubmit={onSubmitHandler}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <FormControl
          required
          sx={{
            width: { xs: "100%", sm: 350 },
            mt: { xs: 2, sm: 3 },
            "& .MuiInputLabel-root": {
              fontSize: { xs: "0.9rem", sm: "1rem" },
            },
            "& .MuiSelect-select": {
              fontSize: { xs: "0.9rem", sm: "1rem" },
            },
            "& .MuiMenuItem-root": {
              fontSize: { xs: "0.9rem", sm: "1rem" },
            },
          }}
        >
          <InputLabel>Contest</InputLabel>
          <Select
            value={contestId}
            label="Contest"
            sx={{ textAlign: "left" }}
            onChange={(e) => setContestId(Number(e.target.value))}
          >
            {availableContests?.map((contest: Contest) => (
              <MenuItem key={contest.id} value={contest.id}>
                {contest.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          type="submit"
          sx={{
            width: { xs: "100%", sm: 170 },
            height: { xs: 40, sm: 44 },
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            mt: { xs: 3, sm: 4 },
            textTransform: "none",
            borderRadius: 2,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            px: { xs: 3, sm: 4.5 },
            py: { xs: 1, sm: 1.25 },
            whiteSpace: "nowrap",
          }}
        >
          Assign Contest
        </Button>
      </form>
    </Modal>
  );
}
