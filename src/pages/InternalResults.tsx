import { useEffect, useState, useRef } from "react";
import { Box, Chip, Container, Paper, Typography, Link, Tab, Tabs, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../theme";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import InternalResultsTable from "../components/Tables/InternalResultsTable";

import { api } from "../lib/api";
import useContestStore from "../store/primary_stores/contestStore";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
  

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

  // selectors to subscribe only to needed state
  const fetchTeamsByContest = useMapContestToTeamStore((state) => state.fetchTeamsByContest);
  const clearTeamsByContest = useMapContestToTeamStore((state) => state.clearTeamsByContest);
  const isLoading = useMapContestToTeamStore((state) => state.isLoadingMapContestToTeam);
  const teamsByContest = useMapContestToTeamStore((state) => state.teamsByContest);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!parsedContestId) return;
  
    const load = async () => {
      try {
        // Fetch immediately to render fast, then tabulate in background and refresh when done
        const initialFetch = fetchTeamsByContest(parsedContestId);

        api.put("/api/tabulation/tabulateScores/", { contestid: parsedContestId })
          .then(() => fetchTeamsByContest(parsedContestId))
          .catch(() => {

          });

        await initialFetch;
      } catch (error) {
        // Still try to fetch teams even if tabulation fails
        await fetchTeamsByContest(parsedContestId);
      } finally {
        setHasLoaded(true);
        isInitialLoadRef.current = false;
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
    if ((activeTab === 1 || activeTab === 2) && parsedContestId) { // Championship or Redesign tab
      const runTabulation = async () => {
        try {
          await api.put(
            "/api/tabulation/tabulateScores/",
            { contestid: parsedContestId },
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

  // Removed duplicate fetch effect to avoid redundant network calls

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Master ScoreSheet Results', 14, 20);
    doc.setFontSize(14);
    doc.text(contest?.name || 'Contest', 14, 30);
    
    // Get table data
    const teams = teamsByContest || [];
    const tableData = teams.map((team: any, index: number) => [
      index + 1,
      team.team_name,
      team.school_name || 'N/A',
      team.journal_score || 0,
      team.presentation_score || 0,
      team.machine_score || 0,
      team.general_penalties || 0,
      team.run_penalties || 0,
      team.total_score || 0,
    ]);
    
    // Generate table
    autoTable(doc, {
      startY: 40,
      head: [['Rank', 'Team', 'School', 'Journal', 'Present.', 'Machine', 'Gen. Penalties', 'Run Penalties', 'Total']],
      body: tableData,
    });
    
    doc.save(`MasterScoreSheet_${contest?.name || 'Contest'}.pdf`);
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 1.5, md: 3 } }}>
        <Box
          sx={{
            opacity: hasLoaded ? 1 : 0,
            transition: hasLoaded ? `opacity ${isInitialLoadRef.current ? '0.6s' : '0.1s'} ease-in` : 'none',
            pointerEvents: hasLoaded ? 'auto' : 'none',
          }}
        >
          <Box sx={{ mb: 2, mt: { xs: 1, sm: 2 } }}>
          {role?.user_type === 4 ? (
            <Button
              component={Link}
              href="/coach/"
              startIcon={<ArrowBackIcon />}
              sx={{
                textTransform: "none",
                color: theme.palette.success.dark,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                fontWeight: 500,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: "8px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(76, 175, 80, 0.08)",
                  transform: "translateX(-2px)",
                },
              }}
            >
              Back to Dashboard
            </Button>
          ) : (
            <Button
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
              sx={{
                textTransform: "none",
                color: theme.palette.success.dark,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                fontWeight: 500,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: "8px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(76, 175, 80, 0.08)",
                  transform: "translateX(-2px)",
                },
              }}
            >
              Back to Results
            </Button>
          )}
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
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
                sx={{ mt: 1,fontSize: { xs: "1rem", sm: "1.25rem" }
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
                  </Box>
                  <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleDownloadPDF}
                  sx={{ ml: 2 }}
                  >
                    Download PDF
                    </Button>
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
        </Box>
      </Container>
    </Box>
  );
};

export default InternalResults;
