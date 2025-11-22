// ==============================
// Component: InternalResults
// Master results page with tabbed interface for preliminary, championship, and redesign results.
// Features live updates, PDF export, and conditional preloader based on navigation source.
// ==============================

// ==============================
// React Core
// ==============================
import { useEffect, useState, useRef, useCallback } from "react";

// ==============================
// Router
// ==============================
import { useParams, useNavigate } from "react-router-dom";

// ==============================
// UI Libraries & Theme
// ==============================
import { Box, Chip, Container, Paper, Typography, Link, Tab, Tabs, Button, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../theme";

// ==============================
// PDF Generation
// ==============================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==============================
// Store Hooks
// ==============================
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import useContestStore from "../store/primary_stores/contestStore";

// ==============================
// Utilities
// ==============================
import { onDataChange, DataChangeEvent } from "../utils/dataChangeEvents";

// ==============================
// Local Components
// ==============================
import InternalResultsTable from "../components/Tables/InternalResultsTable";
import ResultsPreloader from "../components/ResultsPreloader";

// ==============================
// Theme Types
// ==============================
type ThemeType = "green" | "brown" | "black";

const InternalResults: React.FC = () => {
  // ==============================
  // Theme Selection State
  // ==============================
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("green");

  // ==============================
  // Theme Definitions
  // ==============================
  const themes = {
    green: {
      pageBg: "#F3F4F6",
      cardBg: "#FFFFFF",
      primary: "#166534",
      primaryDark: "#064E3B",
      soft: "#E6F4EA",
      border: "#E5E7EB",
      textPrimary: "#0B1120",
      textMuted: "#6B7280",
      shadow: "rgba(15, 23, 42, 0.08)",
    },
    brown: {
      pageBg: "#F5F3F0",
      cardBg: "#FFFFFF",
      primary: "#8B4513",
      primaryDark: "#654321",
      soft: "#F5E6D3",
      border: "#D4C4B0",
      textPrimary: "#3E2723",
      textMuted: "#6D4C41",
      shadow: "rgba(62, 39, 35, 0.08)",
    },
    black: {
      pageBg: "#1A1A1A",
      cardBg: "#2D2D2D",
      primary: "#000000",
      primaryDark: "#000000",
      soft: "#3A3A3A",
      border: "#404040",
      textPrimary: "#FFFFFF",
      textMuted: "#B0B0B0",
      shadow: "rgba(0, 0, 0, 0.3)",
    },
  };

  // Get current theme colors
  const colors = themes[selectedTheme];

  // Typography font families
  const dmSerifFont = '"DM Serif Display", "Georgia", serif';
  const poppinsFont = '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  // ------------------------------
  // Route Parameters & Authentication
  // ------------------------------
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  // ------------------------------
  // Parsed Data
  // ------------------------------
  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;

  // ------------------------------
  // Store State & Actions
  // ------------------------------
  const { contest, fetchContestById, isLoadingContest } = useContestStore();

  // ------------------------------
  // Local UI State
  // ------------------------------
  const [activeTab, setActiveTab] = useState(0);
  const [showPreloader, setShowPreloader] = useState(false);
  const [preloaderMinDone, setPreloaderMinDone] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);
  const [isCachedDataLoad, setIsCachedDataLoad] = useState(false);

  // ==============================
  // Side Effects & Initialization
  // ==============================

  // Scroll to top on contest change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [contestId]);

  // Fetch contest details on mount or contest change
  useEffect(() => {
    if (parsedContestId) {
      fetchContestById(parsedContestId);
    }
  }, [parsedContestId, fetchContestById]);

  // Additional store hooks for team data management
  const fetchTeamsByContest = useMapContestToTeamStore((state) => state.fetchTeamsByContest);
  const isLoading = useMapContestToTeamStore((state) => state.isLoadingMapContestToTeam);
  const teamsByContest = useMapContestToTeamStore((state) => state.teamsByContest);

  // ==============================
  // Data Loading & Effects
  // ==============================

  // Reset loading state when contest changes
  useEffect(() => {
    setHasLoaded(false);
    setIsCachedDataLoad(false);
  }, [parsedContestId]);

  // Preloader timing refs for controlled loading experience
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Control preloader display based on navigation source
  // Only show preloader when navigating from "View Results" button, not on page reloads
  useEffect(() => {
    // Check if we came from the "View Results" button
    const cameFromRankings = sessionStorage.getItem("fromRankings") === "true";
    sessionStorage.removeItem("fromRankings");

    // If we've already loaded or didn't come from rankings, don't show preloader
    if (hasLoaded || !cameFromRankings) return;

    // Start "maybe show preloader" timer
    showTimerRef.current = setTimeout(() => {
      if (!hasLoaded) {
        setShowPreloader(true);
        setPreloaderMinDone(false);

        // Once we actually show it, enforce 1.1s minimum display time
        minTimerRef.current = setTimeout(() => {
          setPreloaderMinDone(true);
        }, 1100);
      }
    }, 40);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [hasLoaded]);

  // Hide preloader only when BOTH conditions are met: data loaded AND minimum time passed
  useEffect(() => {
    if (hasLoaded && preloaderMinDone) {
      setShowPreloader(false);
    }
  }, [hasLoaded, preloaderMinDone]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
    };
  }, []);

  // ==============================
  // Data Loading Functions
  // ==============================

  // Main data loading function with caching support
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

  // Main data loading effect with live updates and focus handling

  useEffect(() => {
    if (!parsedContestId) return;

    load({ force: true });

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
    };
  }, [parsedContestId, load]);

  // ==============================
  // Computed Values
  // ==============================

  // Check if championship advancement has occurred
  const hasChampionshipAdvanced = teamsByContest?.some((team: any) => team.advanced_to_championship === true) ?? false;
  const hasRedesignAdvanced = hasChampionshipAdvanced;

  // ==============================
  // Tab Management
  // ==============================

  // Reset to first tab if championship hasn't advanced yet
  useEffect(() => {
    if (!hasChampionshipAdvanced && activeTab !== 0) {
      setActiveTab(0);
    }
  }, [hasChampionshipAdvanced, activeTab]);

  // ==============================
  // PDF Export Functionality
  // ==============================

  // Generate and download PDF report of contest results
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

  // ==============================
  // Main Component Render
  // ==============================

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