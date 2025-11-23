// ==============================
// Page: InternalResults
// Internal master scoresheet view for admins/coaches.
// - Uses cached data for instant back-navigation
// - Refetches in background to avoid stale data
// - Shows preloader only when coming from rankings & initial load is slow
// ==============================

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Chip,
  Container,
  Paper,
  Typography,
  Link,
  Tab,
  Tabs,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";

import theme from "../theme";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import InternalResultsTable from "../components/Tables/InternalResultsTable";
import ResultsPreloader from "../components/ResultsPreloader";
import useContestStore from "../store/primary_stores/contestStore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { onDataChange, DataChangeEvent } from "../utils/dataChangeEvents";

const InternalResults: React.FC = () => {
  // -------------------------------------
  // Routing / navigation / user role
  // -------------------------------------
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  // Parse contestId from URL
  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;

  // -------------------------------------
  // Contest info (name, etc.)
  // -------------------------------------
  const { contest, fetchContestById, isLoadingContest } = useContestStore();

  // Tabs: 0 = preliminary, 1 = championship, 2 = redesign
  const [activeTab, setActiveTab] = useState(0);

  // -------------------------------------
  // Data + cache from teams store
  // -------------------------------------
  const fetchTeamsByContest = useMapContestToTeamStore(
    (state) => state.fetchTeamsByContest
  );
  const isLoading = useMapContestToTeamStore(
    (state) => state.isLoadingMapContestToTeam
  );
  const teamsByContest = useMapContestToTeamStore(
    (state) => state.teamsByContest
  );

  // We want a "stale-while-revalidate" pattern:
  // - If cached teams exist, show them instantly.
  // - Then refetch in the background to pick up any changes.

  /**
   * Helper: check if we already have cached teams for this contest
   * at mount time. We read directly from the Zustand store.
   */
  const getInitialHasLoaded = () => {
    if (!parsedContestId) return false;
    const state = useMapContestToTeamStore.getState();
    const cachedTeamsForContest =
      state.teamsByContestMap?.[parsedContestId] ?? state.teamsByContest;
    return Boolean(cachedTeamsForContest && cachedTeamsForContest.length);
  };

  // hasLoaded: controls main content opacity & preloader logic
  const [hasLoaded, setHasLoaded] = useState<boolean>(getInitialHasLoaded);
  // isCachedDataLoad: tracks whether this render is coming from cache
  const [isCachedDataLoad, setIsCachedDataLoad] =
    useState<boolean>(getInitialHasLoaded);

  // We track if this is the *very first* load for animation timing
  const isInitialLoadRef = useRef(true);

  // -------------------------------------
  // Preloader state & timers
  // -------------------------------------
  const [showPreloader, setShowPreloader] = useState(false);
  const [preloaderMinDone, setPreloaderMinDone] = useState(false);

  // Timer refs so we can clean up on unmount
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------
  // Scroll to top when contest changes
  // -------------------------------------
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [contestId]);

  // -------------------------------------
  // Fetch contest meta (name, etc.)
  // -------------------------------------
  useEffect(() => {
    if (parsedContestId) {
      fetchContestById(parsedContestId);
    }
  }, [parsedContestId, fetchContestById]);

  // -------------------------------------
  // Reset hasLoaded/isCached when contestId changes,
  // but initialize from store cache instead of blindly to false.
  // -------------------------------------
  useEffect(() => {
    if (!parsedContestId) {
      setHasLoaded(false);
      setIsCachedDataLoad(false);
      return;
    }

    const state = useMapContestToTeamStore.getState();
    const cachedTeamsForContest =
      state.teamsByContestMap?.[parsedContestId] ?? state.teamsByContest;
    const hasCacheForContest = Boolean(
      cachedTeamsForContest && cachedTeamsForContest.length
    );

    setHasLoaded(hasCacheForContest);
    setIsCachedDataLoad(hasCacheForContest);
    // We keep isInitialLoadRef as-is so animations only apply on the
    // true first load.
  }, [parsedContestId]);

  // -------------------------------------
  // Stale-while-revalidate loader for teams
  // -------------------------------------
  const load = useCallback(
    async (options?: { force?: boolean }) => {
      if (!parsedContestId) return;

      // Look into the current store for cached teams
      const state = useMapContestToTeamStore.getState();
      const cachedTeamsForContest =
        state.teamsByContestMap?.[parsedContestId] ?? state.teamsByContest;
      const hasCacheForContest = Boolean(
        cachedTeamsForContest && cachedTeamsForContest.length
      );

      setIsCachedDataLoad(hasCacheForContest);

      // Decide whether to force a fetch:
      // - if caller explicitly wants force → always force
      // - otherwise, only force when we don't have cache yet
      const shouldForce = options?.force ?? !hasCacheForContest;

      try {
        await fetchTeamsByContest(parsedContestId, shouldForce);
      } finally {
        // Once the request returns (even if it used cache), we consider
        // this "loaded" so the main content can fade in.
        setHasLoaded(true);
        isInitialLoadRef.current = false;
      }
    },
    [parsedContestId, fetchTeamsByContest]
  );

  // -------------------------------------
  // Preloader logic:
  // - Only show when coming from "View Results" (rankings → this page)
  // - Only if data isn't already loaded
  // - Only if loading is slower than 40ms (avoid flicker)
  //   And when shown, keep visible for at least 1.1s
  // -------------------------------------
  useEffect(() => {
    // Check if we came from the "View Results" button (rankings page sets this)
    const cameFromRankings = sessionStorage.getItem("fromRankings") === "true";
    sessionStorage.removeItem("fromRankings");

    // If we already have data (cached) or didn't come from rankings:
    // → skip preloader entirely.
    if (hasLoaded || !cameFromRankings) return;

    // Start "maybe show preloader" timer – wait 40ms to avoid flash
    showTimerRef.current = setTimeout(() => {
      if (!hasLoaded) {
        setShowPreloader(true);
        setPreloaderMinDone(false);

        // Once we show it, enforce a minimum visible time of 1.1s
        minTimerRef.current = setTimeout(() => {
          setPreloaderMinDone(true);
        }, 1100);
      }
    }, 40);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [hasLoaded]);

  // -------------------------------------
  // Hide preloader only when:
  //  - data is loaded, AND
  //  - minimum preloader time has passed
  // -------------------------------------
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

  // -------------------------------------
  // Main data loading + background refresh
  // -------------------------------------
  useEffect(() => {
    if (!parsedContestId) return;

    // Initial load:
    // - Reuse cache immediately (hasLoaded already reflects cache)
    // - Fetch using stale-while-revalidate
    load();

    // Background refresh every 5 minutes while tab is visible.
    // We force here to guarantee fresh data, but it happens in background
    // so UI stays instant.
    const interval = setInterval(() => {
      if (!document.hidden) {
        load({ force: true });
      }
    }, 300000); // 300,000ms = 5 minutes

    // On window focus, force a refresh in the background as well.
    const onFocus = () => load({ force: true });
    window.addEventListener("focus", onFocus);

    // Live updates via central dataChangeEvents bus
    const handleDataChange = async (event: DataChangeEvent) => {
      if (
        (event.type === "team" &&
          (event.contestId === parsedContestId || !event.contestId)) ||
        (event.type === "cluster" &&
          (event.contestId === parsedContestId || !event.contestId)) ||
        event.type === "championship"
      ) {
        // Data changed in a meaningful way (tabulation, scoring, etc.)
        // → force a fresh fetch
        await load({ force: true });
      }
    };

    const unsubscribeDataChange = onDataChange(handleDataChange);

    // Specific listener for "championshipUndone" custom event
    const handleChampionshipUndo = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventContestId = customEvent.detail?.contestId;
      if (!parsedContestId) return;
      if (eventContestId && eventContestId !== parsedContestId) return;
      try {
        await load({ force: true });
      } catch {
        // swallow error; UI remains with last known data
      }
    };
    window.addEventListener("championshipUndone", handleChampionshipUndo);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("championshipUndone", handleChampionshipUndo);
      unsubscribeDataChange();
    };
  }, [parsedContestId, load]);

  // -------------------------------------
  // Derived flags from teams
  // -------------------------------------
  const hasChampionshipAdvanced =
    teamsByContest?.some(
      (team: any) => team.advanced_to_championship === true
    ) ?? false;

  const hasRedesignAdvanced = hasChampionshipAdvanced;

  // Ensure we don't leave user on a non-existent tab
  useEffect(() => {
    if (!hasChampionshipAdvanced && activeTab !== 0) {
      setActiveTab(0);
    }
  }, [hasChampionshipAdvanced, activeTab]);

  // -------------------------------------
  // Export to PDF
  // -------------------------------------
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Master ScoreSheet Results", 14, 20);
    doc.setFontSize(14);
    doc.text(contest?.name || "Contest", 14, 30);

    const teams = teamsByContest || [];
    const tableData = teams.map((team: any, index: number) => [
      index + 1,
      team.team_name,
      team.school_name || "N/A",
      team.journal_score || 0,
      team.presentation_score || 0,
      team.machine_score || 0,
      team.general_penalties || 0,
      team.run_penalties || 0,
      team.total_score || 0,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Rank",
          "Team",
          "School",
          "Journal",
          "Present.",
          "Machine",
          "Gen. Penalties",
          "Run Penalties",
          "Total",
        ],
      ],
      body: tableData,
    });

    doc.save(`MasterScoreSheet_${contest?.name || "Contest"}.pdf`);
  };

  // -------------------------------------
  // Render
  // -------------------------------------
  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      {/* Preloader: only visible when showPreloader is true and
          we've not yet satisfied the "hasLoaded + min time" condition. */}
      {showPreloader && !(hasLoaded && preloaderMinDone) && (
        <ResultsPreloader />
      )}

      <Container
        maxWidth={false}
        sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 1.5, md: 3 } }}
      >
        <Box
          sx={{
            // Main fade-in behavior:
            // - If hasLoaded is false → keep content hidden & non-interactive.
            // - Once hasLoaded flips to true → fade opacity in.
            opacity: hasLoaded ? 1 : 0,
            transition:
              hasLoaded && !isCachedDataLoad
                ? // First real load → slightly longer fade
                  `opacity ${
                    isInitialLoadRef.current ? "0.6s" : "0.1s"
                  } ease-in`
                : "none",
            pointerEvents: hasLoaded ? "auto" : "none",
          }}
        >
          {/* Back button row */}
          <Box sx={{ mb: 2, mt: { xs: 1, sm: 2 } }}>
            {role?.user_type === 4 ? (
              // Coach: go back to coach dashboard
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
              // Admin/internal: go back one step in history
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

          {/* Header card */}
          <Paper
            elevation={2}
            sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 1 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                  }}
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
                  {isLoadingContest
                    ? "Loading..."
                    : contest?.name || `ID: ${contestId}`}
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

          {/* Tabs + tables */}
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTabs-scrollButtons": {
                  "&.Mui-disabled": {
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
                  px: { xs: 1, sm: 2 },
                }}
              />
              {hasChampionshipAdvanced && (
                <Tab
                  label="Championship Results"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    minWidth: { xs: "auto", sm: "auto" },
                    px: { xs: 1, sm: 2 },
                  }}
                />
              )}
              {hasRedesignAdvanced && (
                <Tab
                  label="Redesign Results"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    minWidth: { xs: "auto", sm: "auto" },
                    px: { xs: 1, sm: 2 },
                  }}
                />
              )}
            </Tabs>
          </Box>

          {/* Tab content */}
          {activeTab === 0 && (
            <InternalResultsTable
              contestId={parsedContestId}
              resultType="preliminary"
            />
          )}
          {activeTab === 1 && hasChampionshipAdvanced && (
            <InternalResultsTable
              contestId={parsedContestId}
              resultType="championship"
            />
          )}
          {activeTab === 2 && hasChampionshipAdvanced && (
            <InternalResultsTable
              contestId={parsedContestId}
              resultType="redesign"
            />
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default InternalResults;
