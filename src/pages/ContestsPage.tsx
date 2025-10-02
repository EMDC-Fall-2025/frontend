import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { Container } from "@mui/material";
import theme from "../theme";
import { useContestStore } from "../store/primary_stores/contestStore";
import ContestTable from "../components/Tables/ContestTable"; 


export default function Contests() {
  // Zustand store for contests
  const { allContests, fetchAllContests, isLoadingContest } = useContestStore();

  const navigate = useNavigate();

  // Get all contests
  useEffect(() => {
    fetchAllContests();
  }, []);

  // function to create data row 
  function createData(id: number, name: string, date: string, is_open: boolean) {
    return { id, name, date, status: is_open ? "In Progress" : "Finalized" };
  }

  // Navigate to specific contest results
  const handleRowClick = (contestId: number) => {
    navigate(`/contestresults/${contestId}`);
  };

  // transforms array into rows
  const rows = allContests.map((contest) => createData(contest.id, contest.name, contest.date, contest.is_open));

  return (
    <>
      <Typography variant="h1" sx={{ ml: "2%", mt: 4, mb: 4 }}>
        Contests
      </Typography>
      <Container
        sx={{
          width: "90vw",
          padding: 3,
          bgcolor: theme.palette.secondary.light,
          ml: "2%",
          borderRadius: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ContestTable component */}
        <ContestTable
          rows={rows}
          isLoading={isLoadingContest}
          onRowClick={handleRowClick}
        />
      </Container>
    </>
  );
}