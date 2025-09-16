/**
 * ContestModal Component
 * 
 * Modal for creating and editing contests with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import { Button, TextField } from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import React, { useEffect, useState } from "react";
import { useContestStore } from "../../store/primary_stores/contestStore";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateField } from "@mui/x-date-pickers/DateField";
import useMapContestOrganizerStore from "../../store/map_stores/mapContestToOrganizerStore";

export interface IContestModalProps {
  open: boolean;
  handleClose: () => void;
  mode: "new" | "edit";
  contestData?: {
    contestid: number;
    name: string;
    date: string;
  };
}

export default function ContestModal(props: IContestModalProps) {
  const { handleClose, open, mode, contestData } = props;
  const title = mode === "new" ? "New Contest" : "Edit Contest";

  const [contestName, setContestName] = useState("");
  //const [contestDate, setContestDate] = useState("2024-11-13");
  const contestid = contestData?.contestid;
  const { createContest, editContest, fetchAllContests, contestError } =
    useContestStore();
  const { fetchOrganizerNamesByContests } = useMapContestOrganizerStore();

  const [contestDate, setContestDate] = React.useState<Dayjs | null>(null);

  useEffect(() => {
    if (contestData) {
      setContestName(contestData.name);
      setContestDate(dayjs(contestData.date));
    }
  }, [contestData]);

  const handleCreateContest = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createContest({
        name: contestName,
        date: contestDate ? contestDate.format("YYYY-MM-DD") : "",
        is_open: false,
        is_tabulated: false,
      });
      await fetchAllContests();
      await fetchOrganizerNamesByContests();
      handleClose();
    } catch (error) {
      console.error("Failed to create contest: ", error);
    }
  };

  const handleEditContest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (contestid) {
      try {
        await editContest({
          id: contestid,
          name: contestName,
          date: contestDate ? contestDate.format("YYYY-MM-DD") : "",
          is_open: false,
          is_tabulated: false,
        });
        await fetchAllContests();
        handleClose();
      } catch (error) {
        console.error("Failed to edit contest: ", error);
      }
    }
  };

  const buttonText = mode === "new" ? "Create Contest" : "Update Contest";
  const handleSubmit = mode === "new" ? handleCreateContest : handleEditContest;

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={title}
      error={contestError}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TextField
          required
          label="Contest Name"
          variant="outlined"
          value={contestName}
          onChange={(e: any) => setContestName(e.target.value)}
          sx={{ mt: 1, width: 300 }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateField
            label="Date"
            value={contestDate}
            onChange={(newValue) => setContestDate(newValue)}
            sx={{ mt: 2, width: 300 }}
          />
        </LocalizationProvider>
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
          {buttonText}
        </Button>
      </form>
    </Modal>
  );
}
