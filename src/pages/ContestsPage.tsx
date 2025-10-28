import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { Container, Stack } from "@mui/material";
import theme from "../theme";
import { useContestStore } from "../store/primary_stores/contestStore";
import ContestTable from "../components/Tables/ContestTable";

// FILE OVERVIEW: page for displaying contests
export default function Contests() {
  const { allContests, fetchAllContests, isLoadingContest } = useContestStore();
  const navigate = useNavigate();

  // Get all contests
  useEffect(() => {
    fetchAllContests();
  }, []);

  // function to create data row
  function createData(
    id: number,
    name: string,
    date: string,
    is_open: boolean
  ) {
    const today = new Date();
    const contestDate = new Date(date);
    let status = "";

    if (!is_open && contestDate < today) {
      status = "Finalized";
    } else if (is_open) {
      status = "In Progress";
    } else {
      status = "Not Started";
    }

    return { id, name, date, status };
  }

  // Navigate to specific contest results
  const handleRowClick = (contestId: number) => {
    navigate(`/contestresults/${contestId}`);
  };

  // transforms array into rows
  const rows = allContests
    .map((contest: { id: number; name: string; date: string; is_open: boolean }) =>
      createData(contest.id, contest.name, contest.date, contest.is_open)
    )
    .sort((a: { status: string }, b: { status: string }) => {
      const order = { Finalized: 1, "In Progress": 2, "Not Started": 3 };
      return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
    });

  return (
    <>
      {/* Title Section */}
      <Stack spacing={1} sx={{ mt: 5, mb: 3, ml: { xs: 3, sm: 6, md: 10 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: theme.palette.primary.main,
          }}
        >
          Contests
        </Typography>
      </Stack>

      {/* Table Container */}
      <Container
        maxWidth="lg"
        sx={{
          border: `1px solid ${theme.palette.grey[300]}`,
          borderRadius: 3,
          backgroundColor: "#fff",
          p: 3,
        }}
      >
        <ContestTable
          rows={rows}
          isLoading={isLoadingContest}
          onRowClick={handleRowClick}
        />
      </Container>
    </>
  );
}
