import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // 
import Typography from "@mui/material/Typography";
import { Container, Stack } from "@mui/material";
import theme from "../theme";
import { useContestStore } from "../store/primary_stores/contestStore";
import ContestTable from "../components/Tables/ContestTable";
import toast from "react-hot-toast";

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
    is_open: boolean,
    is_tabulated?: boolean
  ) {
    let status = "";

    if (is_open) {
      status = "In Progress";
    } else if (is_tabulated) {
      status = "Finalized";
    } else {
      status = "Not Started";
    }

    return { id, name, date, status };
  }


  // Navigate to specific contest results
  const handleRowClick = (contestId: number) => {
    const contest = allContests.find((c: any) => c.id === contestId);
    if (contest && contest.is_open == false && contest.is_tabulated == true) {
      navigate(`/contestresults/${contestId}`);
    } else {
      toast.success(
        "🎉 Stay tuned! Results will be available once the contest ends and scores are finalized!",
        {
          duration: 4000,
          style: {
            background: '#4caf50',
            color: '#fff',
            fontWeight: 600,
            fontSize: '15px',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#4caf50',
          },
        }
      );
    }
  };

  // transforms array into rows
  const rows = allContests
    .map((contest: { id: number; name: string; date: string; is_open: boolean; is_tabulated: boolean }) =>
      createData(contest.id, contest.name, contest.date, contest.is_open, contest.is_tabulated)
    )

    .sort((a: { status: string }, b: { status: string }) => {
      const order = { Finalized: 1, "In Progress": 2, "Not Started": 3 };
      return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
    });

  return (
    <>
      {/* Title Section */}
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 3, sm: 5 },
          mt: 5,
          mb: 2,
        }}
      >
        {/* Back to Homepage */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "inline-block",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              fontSize: "1.05rem",
              "&:hover": { color: theme.palette.primary.main },
            }}
          >
            {"<"} Back to Homepage{" "}
          </Typography>
        </Link>

        <Stack spacing={1} sx={{ mb: 1 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              fontWeight: 400,
              color: theme.palette.primary.main,
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Contests
          </Typography>
        </Stack>

      </Container>

      {/* Table Container */}
      <Container
        maxWidth="lg"
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "none",
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
