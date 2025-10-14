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


  useEffect(() => {
    if (!parsedContestId) return;
  
    const load = async () => {
      try {
        // Tabulate scores to ensure they're calculated
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
        
        // Fetch the updated teams with calculated scores
        await fetchTeamsByContest(parsedContestId);
      } catch (error) {
        // Still try to fetch teams even if tabulation fails
        await fetchTeamsByContest(parsedContestId);
      }
    };
  
    load(); // initial
  
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
  
    return () => {
      window.removeEventListener("focus", onFocus);
      clearTeamsByContest();
    };
  }, [parsedContestId]);

  const { fetchTeamsByContest, clearTeamsByContest, isLoading } =
    (useMapContestToTeamStore() as any) || {};

  useEffect(() => {
    const idNum = contestId ? Number(contestId) : NaN;
    if (!Number.isNaN(idNum) && typeof fetchTeamsByContest === "function") {
      fetchTeamsByContest(idNum);
    }
    return () => {
      if (typeof clearTeamsByContest === "function") clearTeamsByContest();
    };
  }, [contestId, fetchTeamsByContest, clearTeamsByContest]);

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
          <Typography variant="h4" fontWeight={800}>
            Master ScoreSheet Results
          </Typography>
          <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
            Contest ID: {contestId}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip size="small" color="success" label={isLoading ? "Loading…" : "Live"} />
          </Box>
        </Paper>

        {/* Store-only. If store returns nothing, table will show an empty body. */}
        <InternalResultsTable />
      </Container>
    </Box>
  );
};

export default InternalResults;
