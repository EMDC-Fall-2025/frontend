import { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, Link, Typography, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMapContestOrganizerStore } from "../../store/map_stores/mapContestToOrganizerStore";
import { useAuthStore } from "../../store/primary_stores/authStore";
import { useContestStore } from "../../store/primary_stores/contestStore";
import AreYouSureModal from "../Modals/AreYouSureModal";
import useMapScoreSheetStore from "../../store/map_stores/mapScoreSheetStore";
import theme from "../../theme";
import { useTabulateStore } from "../../store/primary_stores/tabluateStore";

interface IOrganizerContestTableProps {
  type: "past" | "current" | string;
  organizers: { id: number; name: string; email: string }[];
}

enum ContestAction {
  Open = "open",
  Close = "close",
  Reopen = "reopen",
}

function createCurrentData(
  contestName: string,
  startEndContest: any,
  manageContest: any
) {
  return { contestName, startEndContest, manageContest };
}

function createPastData(
  contestName: string,
  reopenContest: any,
  contestResults: any
) {
  return { contestName, reopenContest, contestResults };
}

export default function OrganizerContestTable(
  props: IOrganizerContestTableProps
) {
  const { type } = props;
  const navigate = useNavigate();
  const [startAreYouSure, setStartAreYouSure] = useState(false);
  const [endAreYouSure, setEndAreYouSure] = useState(false);
  const [reopenAreYouSure, setReopenAreYouSure] = useState(false);

  const [selectedContest, setSelectedContest] = useState<any>(null);

  const {
    fetchContestsByOrganizerId,
    contests,
    isLoadingMapContestOrganizer,
    clearContests,
    mapContestOrganizerError,
    clearMapContestOrganizerError,
  } = useMapContestOrganizerStore();
  const { role } = useAuthStore();
  const { editContest, contestError } = useContestStore();
  const {
    allSubmittedForContests,
    clearAllSubmittedForContests,
    mapScoreSheetError,
    clearMapScoreSheetError,
  } = useMapScoreSheetStore();
  const { tabulateContest, tabulateError, clearTabulateError } =
    useTabulateStore();

  const organizerId = role ? role.user.id : null;

  useEffect(() => {
    if (organizerId) {
      fetchContestsByOrganizerId(organizerId);
    }
  }, [organizerId]);

  useEffect(() => {
    const handlePageHide = () => {
      clearContests();
      clearAllSubmittedForContests();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (mapScoreSheetError || mapContestOrganizerError || tabulateError) {
      const timer = setTimeout(() => {
        clearMapContestOrganizerError();
        clearMapScoreSheetError();
        clearTabulateError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [
    mapScoreSheetError,
    mapContestOrganizerError,
    tabulateError,
    clearMapContestOrganizerError,
    clearMapScoreSheetError,
    clearTabulateError,
  ]);

  const handleEditContest = async (action: ContestAction) => {
    if (!selectedContest) return;

    let editedContest;

    switch (action) {
      case ContestAction.Open:
        editedContest = {
          id: selectedContest.id,
          name: selectedContest.name,
          date: selectedContest.date,
          is_open: true,
          is_tabulated: false,
        };
        await editContest(editedContest);
        setStartAreYouSure(false);
        break;
      case ContestAction.Close:
        editedContest = {
          id: selectedContest.id,
          name: selectedContest.name,
          date: selectedContest.date,
          is_open: false,
          is_tabulated: true,
        };
        try {
          await tabulateContest(selectedContest.id);
          await editContest(editedContest);
          setEndAreYouSure(false);
        } catch {}
        setEndAreYouSure(false);
        break;
      case ContestAction.Reopen:
        editedContest = {
          id: selectedContest.id,
          name: selectedContest.name,
          date: selectedContest.date,
          is_open: true,
          is_tabulated: false,
        };
        await editContest(editedContest);
        setReopenAreYouSure(false);
        break;
      default:
        break;
    }

    if (organizerId) {
      await fetchContestsByOrganizerId(organizerId);
    }
  };

  let rows: any[] = [];

  // 1) When building rows for CURRENT contests: make the action links green-themed
if (type === "current" && contests) {
  rows = contests
    .filter((contest) => !contest.is_tabulated)
    .map((contest) => {
      const buttonText = contest.is_open ? "End Contest" : "Start Contest";
      const disabledCond =
        contest.is_open &&
  allSubmittedForContests &&
  allSubmittedForContests[contest.id] !== true;

      return createCurrentData(
        contest.name,
        <Link
          component="button"
          disabled={disabledCond}
          onClick={() => {
            setSelectedContest(contest);
            contest.is_open ? setEndAreYouSure(true) : setStartAreYouSure(true);
          }}
          sx={{
            textDecoration: "none",
            fontWeight: 600,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            color: disabledCond ? "text.disabled" : theme.palette.success.main,
            opacity: disabledCond ? 0.6 : 1,
            "&:hover": disabledCond
              ? {}
              : { backgroundColor: "rgba(46,125,50,0.06)" }, // success green wash
          }}
        >
          {buttonText}
        </Link>,
        <Link
          component="button"
          onClick={() => {
            navigate(`/manage-contest/${contest.id}/`);
          }}
          sx={{
            textDecoration: "none",
            fontWeight: 500,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            color: theme.palette.success.main,
            "&:hover": { backgroundColor: "rgba(46,125,50,0.06)" },
          }}
        >
          Manage Contest
        </Link>
      );
    });
}


  if (type === "past" && contests) {
    rows = contests
      .filter((contest) => contest.is_tabulated && !contest.is_open)
      .map((contest) => {
        return createPastData(
          contest.name,
          <Link
            component="button"
            onClick={() => {
              setSelectedContest(contest);
              setReopenAreYouSure(true);
            }}
            sx={{ textDecoration: "none" }}
          >
            Reopen Contest
          </Link>,
          <Link
            component="button"
            onClick={() => {
              navigate(`/results/${contest.id}/`);
            }}
            sx={{ textDecoration: "none" }}
          >
            View Results
          </Link>
        );
      });
  }

  return (
    <>
      <TableContainer component={Box}>
        {isLoadingMapContestOrganizer ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <>
            <Box sx={{ px: 3, py: 4 }}>
            <Typography variant="body1" color="text.primary">
              {type === "current" ? "No Current Contests" : "No Past Contests"}
            </Typography>
          </Box>
          </>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow
    sx={{
      bgcolor: "rgba(46, 125, 50, 0.06)", // light green background
    }}
  >
    <TableCell
      align="left"
      sx={{
        fontWeight: 600,
      }}
    >
      Contest Name
    </TableCell>
    {type === "current" && (
      <>
        <TableCell
          align="left"
          sx={{
            fontWeight: 600
          }}
        >
          Start/End Contest
        </TableCell>
        <TableCell
          align="left"
          sx={{
            fontWeight: 600
          }}
        >
          Manage Contest
        </TableCell>
      </>
    )}
    {type === "past" && (
      <>
        <TableCell
          align="left"
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          Reopen Contest
        </TableCell>
        <TableCell
          align="left"
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          View Results
        </TableCell>
      </>
    )}
  </TableRow>
            </TableHead>
            <TableBody>
    {rows.map((row, index) => (
      <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
        {/* Contest Name cell below the title: use heading font + bolder weight */}
        <TableCell
          align="left"
          component="th"
          scope="row"
          sx={(theme) => ({
            fontWeight: 500,
            fontFamily: theme.typography.h1.fontFamily, // match your title font
            fontSize: "1rem", // slightly larger than body for emphasis
          })}
        >
          {row?.contestName}
        </TableCell>

        {type === "current" && (
          <>
            <TableCell align="left">{row?.startEndContest}</TableCell>
            <TableCell align="left">{row?.manageContest}</TableCell>
          </>
        )}

        {type === "past" && (
          <>
            <TableCell align="left">{row?.reopenContest}</TableCell>
            <TableCell align="left">{row?.contestResults}</TableCell>
          </>
        )}
      </TableRow>
    ))}
  </TableBody>
          </Table>
        )}

        {/* Modal for starting contest */}
        <AreYouSureModal
          open={startAreYouSure}
          handleClose={() => setStartAreYouSure(false)}
          handleSubmit={() => handleEditContest(ContestAction.Open)}
          title="Are you sure you want to start the contest?"
          error={contestError}
        />

        {/* Modal for ending contest */}
        <AreYouSureModal
          open={endAreYouSure}
          handleClose={() => setEndAreYouSure(false)}
          handleSubmit={() => handleEditContest(ContestAction.Close)}
          title="Are you sure you want to end the contest?"
          error={contestError}
        />

        {/* Modal for reopening contest */}
        <AreYouSureModal
          open={reopenAreYouSure}
          handleClose={() => setReopenAreYouSure(false)}
          handleSubmit={() => handleEditContest(ContestAction.Reopen)}
          title="Are you sure you want to reopen the contest?"
          error={contestError}
        />
      </TableContainer>
      {mapScoreSheetError && (
        <Alert severity="error">{mapScoreSheetError}</Alert>
      )}
      {mapContestOrganizerError && (
        <Alert severity="error">{mapContestOrganizerError}</Alert>
      )}
      {tabulateError && <Alert severity="error">{tabulateError}</Alert>}
    </>
  );
}
