import { useEffect, useState } from "react";
import { Box, Chip, Container, Paper, Typography, Link, Tab, Tabs } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import InternalResultsTable from "../components/Tables/InternalResultsTable";

import axios from "axios";
import useContestStore from "../store/primary_stores/contestStore";

  

const InternalResults: React.FC = () => {


  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;
  const { contest, fetchContestById, isLoadingContest } = useContestStore();
  const [activeTab, setActiveTab] = useState(0);
  


  // Fetch contest information
  useEffect(() => {
    if (parsedContestId) {
      fetchContestById(parsedContestId);
    }
  }, [parsedContestId, fetchContestById]);

  const { fetchTeamsByContest, clearTeamsByContest, isLoading, teamsByContest } =
    (useMapContestToTeamStore() as any) || {};

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
  
    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      load();
    }, 20000); // 20 seconds
  
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
  
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      clearTeamsByContest();
    };
  }, [parsedContestId, fetchTeamsByContest, clearTeamsByContest]);

  // Trigger tabulation when switching to championship or redesign tabs
  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) { // Championship or Redesign tab
      const runTabulation = async () => {
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
          
          // Fetch the updated teams with calculated scores
          await fetchTeamsByContest(parsedContestId);
        } catch (error) {
          console.error('Error running tabulation:', error);
        }
      };
      
      runTabulation();
    }
  }, [activeTab, parsedContestId, fetchTeamsByContest]);

  // Check if any teams have advanced to championship
  const hasChampionshipAdvanced = teamsByContest?.some((team: any) => team.advanced_to_championship === true);
  
  // Redesign works if any team has advanced to championship (regardless of championship status)
  // and includes teams that are not in the championship
  const hasRedesignAdvanced = hasChampionshipAdvanced;

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
              fontSize: { xs: "1rem", sm: "1.25rem" }
            }}
          >
            {isLoadingContest ? "Loading..." : contest?.name || `ID: ${contestId}`}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip 
              size="small" 
              color="success" 
              label={isLoading ? "Loading…" : "Live"}
              sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
            />
          </Box>
        </Paper>

        
        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            }}
          >
            <Tab 
              label="Preliminary Results" 
              sx={{ 
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: { xs: "auto", sm: "auto" },
                px: { xs: 1, sm: 2 }
              }} 
            />
            {hasChampionshipAdvanced && (
              <Tab 
                label="Championship Results" 
                sx={{ 
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 1, sm: 2 }
                }} 
              />
            )}
            {hasRedesignAdvanced && (
              <Tab 
                label="Redesign Results" 
                sx={{ 
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 1, sm: 2 }
                }} 
              />
            )}
          </Tabs>
        </Box>
        {activeTab === 0 && (
          <InternalResultsTable contestId={parsedContestId} resultType="preliminary" />
        )}
        {activeTab === 1 && hasChampionshipAdvanced && ( 
          <InternalResultsTable contestId={parsedContestId} resultType="championship" />
        )}
        {activeTab === 2 && hasChampionshipAdvanced && ( 
          <InternalResultsTable contestId={parsedContestId} resultType="redesign" />
        )}
            </Container>
    </Box>
  );
};

export default InternalResults;
