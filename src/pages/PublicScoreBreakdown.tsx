// ==============================
// Component: PublicScoreBreakdown
// Displays detailed score breakdown for a team's performance across all scoring categories.
// Shows loading skeleton while data is being fetched and renders organized sections for each score type.
// ==============================

// ==============================
// React Core
// ==============================
import { useEffect, useRef } from "react";

// ==============================
// UI Libraries & Theme
// ==============================
import { Typography, Button, Box, Skeleton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../theme";

// ==============================
// Router
// ==============================
import { useParams, useNavigate } from "react-router-dom";

// ==============================
// Store Hooks
// ==============================
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";

// ==============================
// Data & Questions
// ==============================
import { journalQuestions } from "../data/journalQuestions";
import { presentationQuestions } from "../data/presentationQuestions";
import { machineDesignQuestions } from "../data/machineDesignQuestions";

// ==============================
// Local Table Components
// ==============================
import ScoreBreakdownTableStandard from "../components/Tables/ScoreBreakdownTableStandard";
import ScoreBreakdownTableGeneralPenalties from "../components/Tables/ScoreBreakdownTableGeneralPenalties";
import ScoreBreakdownTableRunPenalties from "../components/Tables/ScoreBreakdownTableRunPenalties";

export default function PublicScoreBreakdown() {
  // ------------------------------
  // Route Parameters
  // ------------------------------
  const { teamId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId, 10) : undefined;

  // ------------------------------
  // Store State & Actions
  // ------------------------------
  const { getScoreSheetBreakdown, isLoadingScoreSheet, clearScoreBreakdown } =
    useScoreSheetStore();

  // ------------------------------
  // Navigation
  // ------------------------------
  const navigate = useNavigate();

  // ------------------------------
  // Data Loading & Effects
  // ------------------------------

  // Fetch score breakdown data once on mount (prevent double-invocation in React 18 StrictMode)
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true; // guard against React 18 StrictMode double-invoke
    if (parsedTeamId) {
      getScoreSheetBreakdown(parsedTeamId);
    }
    return () => {
      clearScoreBreakdown();
    };
  }, [parsedTeamId, getScoreSheetBreakdown, clearScoreBreakdown]);

  // Clear data on page hide/unload to prevent memory leaks
  useEffect(() => {
    const handlePageHide = () => {
      clearScoreBreakdown();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [clearScoreBreakdown]);

  // ==============================
  // Loading State Render
  // ==============================

  if (isLoadingScoreSheet) {
    return (
    <>
      <Box sx={{ mb: 2, mt: { xs: 2, sm: 3 }, ml: { xs: 2, sm: 3 } }}>
        <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 1 }} />
      </Box>

      <Skeleton variant="text" sx={{ ml: { xs: 2, sm: 5 }, mt: { xs: 2, sm: 5 }, mr: { xs: 2, sm: 5 } }} width={280} height={48} />
      
      <Skeleton variant="text" sx={{ m: { xs: 2, sm: 5 } }} width={200} height={36} />
      <Box sx={{ mx: { xs: 2, sm: 5 }, mb: 2 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Box>

      <Skeleton variant="text" sx={{ m: { xs: 2, sm: 5 } }} width={200} height={36} />
      <Box sx={{ mx: { xs: 2, sm: 5 }, mb: 2 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Box>

      <Skeleton variant="text" sx={{ m: { xs: 2, sm: 5 } }} width={320} height={36} />
      <Box sx={{ mx: { xs: 2, sm: 5 }, mb: 2 }}>
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
      </Box>

      <Skeleton variant="text" sx={{ mt: { xs: 2, sm: 5 }, ml: { xs: 2, sm: 5 }, mr: { xs: 2, sm: 5 } }} width={220} height={36} />
      <Box sx={{ mx: { xs: 2, sm: 5 }, mb: 2 }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      </Box>

      <Skeleton variant="text" sx={{ mt: { xs: 2, sm: 5 }, ml: { xs: 2, sm: 5 }, mr: { xs: 2, sm: 5 } }} width={200} height={36} />
      <Box sx={{ mx: { xs: 2, sm: 5 } }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      </Box>
    </>
  );

  // ==============================
  // Main Content Render
  // ==============================

  return (
    <>
      {/* ==============================
          Page Header & Navigation
          ============================== */}
      <Box sx={{ mb: 2, mt: { xs: 2, sm: 3 }, ml: { xs: 2, sm: 3 } }}>
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
      </Box>
      <Typography 
        variant="h1" 
        sx={{ 
          ml: { xs: 2, sm: 5 }, 
          mt: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 }, 
          mb: { xs: 1, sm: 2 },
          fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Score Breakdown
      </Typography>

      {/* ==============================
          Scoring Category Sections
          ============================== */}

      {/* Journal Scores Section */}
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Journal
      </Typography>
      <ScoreBreakdownTableStandard type={2} questions={journalQuestions} />

      {/* Presentation Scores Section */}
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Presentation
      </Typography>
      <ScoreBreakdownTableStandard type={1} questions={presentationQuestions} />

      {/* Machine Design Scores Section */}
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Machine Design and Operation
      </Typography>
      <ScoreBreakdownTableStandard
        type={3}
        questions={machineDesignQuestions}
      />

      {/* General Penalties Section */}
      <Typography 
        variant="h2" 
        sx={{ 
          mt: { xs: 2, sm: 5 }, 
          ml: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 },
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        General Penalties
      </Typography>
      <ScoreBreakdownTableGeneralPenalties />

      {/* Run Penalties Section */}
      <Typography 
        variant="h2" 
        sx={{ 
          mt: { xs: 2, sm: 5 }, 
          ml: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 },
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Run Penalties
      </Typography>
      <ScoreBreakdownTableRunPenalties />
    </>
  );
}
