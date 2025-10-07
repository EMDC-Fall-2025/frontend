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
  const { allContests } = useContestStore();
  const {
    contestsByOrganizers,
    createContestOrganizerMapping,
    fetchContestsByOrganizers,
  } = useMapContestOrganizerStore();
  const title = "Assign Contest To Organizer";
  const [contestId, setContestId] = useState(0);
  const [assignedContests, setAssignedContests] = useState<Contest[]>([]);

  useEffect(() => {
    if (contestsByOrganizers[organizerId]) {
      setAssignedContests(contestsByOrganizers[organizerId] || []);
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
        toast.success("Contest assigned to organizer successfully!");
        handleClose();
      } catch (error) {
        console.error("Failed to assign contest: ", error);
        toast.error("Failed to assign contest. Please try again.");
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
            height: 44,
            bgcolor: theme.palette.success.main,          
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            mt: 4,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Assign Contest
        </Button>
      </form>
    </Modal>
  );
}
