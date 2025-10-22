import { useEffect } from "react";
import { Box, Chip, Container, Paper, Typography, Link } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import InternalResultsTable from "../components/Tables/InternalResultsTable";
import axios from "axios";

const InternalResults: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;

  const { fetchTeamsByContest, clearTeamsByContest, isLoading } =
    (useMapContestToTeamStore() as any) || {};

  useEffect(() => {
    if (!parsedContestId) return;

    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          "/api/tabulation/tabulateScores/",
          { contestid: parsedContestId },
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        await fetchTeamsByContest(parsedContestId);
      } catch (error) {
        await fetchTeamsByContest(parsedContestId);
      }
    };

    load();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearTeamsByContest();
    };
  }, [parsedContestId]);

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 1.5, md: 3 } }}>
        <Box sx={{ mb: 1 }}>
          {role?.user_type === 4 ? (
            <Link href="/coach/" sx={{ textDecoration: "none" }}>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {"<"} Back to Dashboard{" "}
              </Typography>
            </Link>
          ) : (
            <Link onClick={() => navigate(-1)} sx={{ textDecoration: "none", cursor: "pointer" }}>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {"<"} Back to Results{" "}
              </Typography>
            </Link>
          )}
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 1 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}
          >
            Master ScoreSheet Results
          </Typography>

          <Typography
            variant="h6"
            color="success.main"
            sx={{
              mt: 1,
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            Contest ID: {contestId}
          </Typography>

          {/* ✅ Live chip */}
          <Box sx={{ mt: 1 }}>
            <Chip
              size="small"
              color="success"
              label={isLoading ? "Loading…" : "Live"}
              sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
            />
          </Box>
        </Paper>

        <InternalResultsTable />
      </Container>
    </Box>
  );
};

export default InternalResults;
