import { useEffect, useState, useRef, useCallback } from "react";
import { Box, Chip, Container, Paper, Typography, Link, Tab, Tabs, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../theme";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import InternalResultsTable from "../components/Tables/InternalResultsTable";
import ResultsPreloader from "../components/ResultsPreloader";
import useContestStore from "../store/primary_stores/contestStore";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { onDataChange, DataChangeEvent } from "../utils/dataChangeEvents";
  
const InternalResults: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const [showPreloader, setShowPreloader] = useState(false);
  const [preloaderMinDone, setPreloaderMinDone] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [contestId]);
  
  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;
  const { contest, fetchContestById, isLoadingContest } = useContestStore();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (parsedContestId) {
      fetchContestById(parsedContestId);
    }
  }, [parsedContestId, fetchContestById]);

  const fetchTeamsByContest = useMapContestToTeamStore((state) => state.fetchTeamsByContest);
  const isLoading = useMapContestToTeamStore((state) => state.isLoadingMapContestToTeam);
  const teamsByContest = useMapContestToTeamStore((state) => state.teamsByContest);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);
  const [isCachedDataLoad, setIsCachedDataLoad] = useState(false);

  useEffect(() => {
    setHasLoaded(false);
    setIsCachedDataLoad(false);
  }, [parsedContestId]);

  useEffect(() => {
    sessionStorage.removeItem('fromRankings');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let forceHideTimer: ReturnType<typeof setTimeout> | undefined;

    if (!hasLoaded) {
      timer = setTimeout(() => {
        if (!hasLoaded) {
          setShowPreloader(true);
          setPreloaderMinDone(false);
        }
      }, 40);

      forceHideTimer = setTimeout(() => {
        setPreloaderMinDone(true);
        setShowPreloader(false);
      }, 1500);

      return () => {
        clearTimeout(timer);
        if (forceHideTimer) clearTimeout(forceHideTimer);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (forceHideTimer) clearTimeout(forceHideTimer);
    };
  }, [hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      setShowPreloader(false);
      setPreloaderMinDone(true);
    }
  }, [hasLoaded]);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      if (!parsedContestId) return;
      const state = useMapContestToTeamStore.getState();
      const cachedTeamsForContest =
        state.teamsByContestMap?.[parsedContestId] ?? state.teamsByContest;
      const hasCacheForContest = Boolean(cachedTeamsForContest && cachedTeamsForContest.length);
      setIsCachedDataLoad(hasCacheForContest);

      try {
        await fetchTeamsByContest(parsedContestId, options?.force);
      } finally {
        setHasLoaded(true);
        isInitialLoadRef.current = false;
      }
    },
    [parsedContestId, fetchTeamsByContest]
  );

  useEffect(() => {
    if (!parsedContestId) return;

    load(); // initial

    const interval = setInterval(() => {
      if (!document.hidden) {
        load();
      }
    }, 300000);

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    const handleDataChange = async (event: DataChangeEvent) => {
      if (
        (event.type === 'team' && (event.contestId === parsedContestId || !event.contestId)) ||
        (event.type === 'cluster' && (event.contestId === parsedContestId || !event.contestId)) ||
        (event.type === 'championship')
      ) {
        await load({ force: true });
      }
    };

    const unsubscribeDataChange = onDataChange(handleDataChange);

    const handleChampionshipUndo = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventContestId = customEvent.detail?.contestId;
      if (!parsedContestId) return;
      if (eventContestId && eventContestId !== parsedContestId) return;
      try {
        await load({ force: true });
      } catch {}
    };
    window.addEventListener("championshipUndone", handleChampionshipUndo);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("championshipUndone", handleChampionshipUndo);
      unsubscribeDataChange();

      // ----------- 
      // KEY OPTIMIZATION:
      // DO NOT clearTeamsByContest() here! 
      // This allows cached team data for the contest to survive across navigation.
      // Only clear cache on explicit contest switch/log out/hard reload if desired.
      // -----------
    };
  }, [parsedContestId, load]);

  // Only run tabulation on demand - removed automatic tabulation on tab switches

  const hasChampionshipAdvanced = teamsByContest?.some((team: any) => team.advanced_to_championship === true) ?? false;
  const hasRedesignAdvanced = hasChampionshipAdvanced;

  useEffect(() => {
    if (!hasChampionshipAdvanced && activeTab !== 0) {
      setActiveTab(0);
    }
  }, [hasChampionshipAdvanced, activeTab]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Master ScoreSheet Results', 14, 20);
    doc.setFontSize(14);
    doc.text(contest?.name || 'Contest', 14, 30);

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
    autoTable(doc, {
      startY: 40,
      head: [['Rank', 'Team', 'School', 'Journal', 'Present.', 'Machine', 'Gen. Penalties', 'Run Penalties', 'Total']],
      body: tableData,
    });
    doc.save(`MasterScoreSheet_${contest?.name || 'Contest'}.pdf`);
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      {showPreloader && !(hasLoaded && preloaderMinDone) && <ResultsPreloader />}
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 1.5, md: 3 } }}>
        <Box
          sx={{
            opacity: hasLoaded ? 1 : 0,
            transition: hasLoaded && !isCachedDataLoad ? `opacity ${isInitialLoadRef.current ? '0.6s' : '0.1s'} ease-in` : 'none',
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
                  color={isLoading ? "warning" : "success"}
                  label={isLoading ? "Updating…" : "Live"}
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