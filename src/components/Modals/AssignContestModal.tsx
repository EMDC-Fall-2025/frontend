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
  const { allContests } = useContestStore();
  const {
    contestsByOrganizers,
    createContestOrganizerMapping,
    fetchContestsByOrganizers,
    mapContestOrganizerError,
  } = useMapContestOrganizerStore();
  const title = "Assign Contest To Organizer";
  const [contestId, setContestId] = useState(0);
  const [assignedContests, setAssignedContests] = useState<Contest[]>([]);

  useEffect(() => {
    if (contestsByOrganizers[organizerId]) {
      setAssignedContests(contestsByOrganizers[organizerId]);
    }
  }, [organizerId]);

  const handleCloseModal = () => {
    handleClose();
    setContestId(0);
  };

  const handleAssignContest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (organizerId) {
      try {
        await createContestOrganizerMapping(organizerId, contestId);
        await fetchContestsByOrganizers();
        handleClose();
      } catch (error) {
        console.error("Failed to assign contest: ", error);
      }
    }
  };

  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    handleAssignContest(e);
  };

  const availableContests = allContests?.filter(
    (contest: Contest) =>
      !assignedContests.some((assigned) => assigned.id === contest.id)
  );

  return (
    <Modal
      open={open}
      handleClose={handleCloseModal}
      title={title}
      error={mapContestOrganizerError}
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
            width: 350,
            mt: 3,
          }}
        >
          <InputLabel>Contest</InputLabel>
          <Select
            value={contestId}
            label="Cluster"
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
        {/* Submit button - updated to use modern green success theme */}
        <Button
          type="submit"
          sx={{
            width: 170,
            height: 44,                                    // Consistent height (was 35)
            bgcolor: theme.palette.success.main,          // Green theme (was primary.main)
            "&:hover": { bgcolor: theme.palette.success.dark }, // Hover effect
            color: "#fff",                                // White text (was secondary.main)
            mt: 4,
            textTransform: "none",                        // No uppercase transformation
            borderRadius: 2,                              // Modern border radius
          }}
        >
          Assign Contest
        </Button>
      </form>
    </Modal>
  );
}
